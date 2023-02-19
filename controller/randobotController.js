import RandomGenerator from "../utils/randomGenerator.js";
import {ROBOT_STATE_ACTION, ROBOT_STATE_CONTROL, ROBOT_STATE_DEAD, ROBOT_STATE_WINNER} from "../game/robot.js";

export default class RandobotController {
    currentActionIndex = 0
    possibleHandCardIndexes = []
    currentToggleIndex = 0
    currentPhase = 0

    /**
     * @param {Robot} robot
     * @param {?string} randomSeedString
     */
    constructor(robot, randomSeedString) {
        this.robot = robot
        this._randomGenerator = new RandomGenerator(randomSeedString);
    }

    /**
     * @param {CardsRender} cardsRender
     */
    initialize(cardsRender) {
        if (this.render !== undefined) throw "This controller has already been initialized"
        this.render = cardsRender

        const interval = setInterval(() => {
            if (this.robot.state === ROBOT_STATE_CONTROL) this.doAction()
            if (this.robot.state === ROBOT_STATE_ACTION) this.render.actionCards.style.visibility = ""
            if (this.robot.state === ROBOT_STATE_WINNER || this.robot.state === ROBOT_STATE_DEAD) clearInterval(interval)
        }, 200)
    }

    afterRender() {
    }

    doAction() {
        const phases = [
            () => {
                this.render.actionCards.style.visibility = "hidden"
                this.possibleHandCardIndexes = [...this.robot.handCards.keys()]

                return true
            },
            () => {
                this.possibleHandCardIndexes = this.possibleHandCardIndexes
                    .map(i => ({i, sort: this._randomGenerator.nextRandom()}))
                    .sort((a, b) => a.sort - b.sort)
                    .map(({i}) => i)

                this.robot.chooseAction(this.possibleHandCardIndexes.pop(), this.currentActionIndex++)

                return this.possibleHandCardIndexes.length === 0 || this.currentActionIndex >= this.robot.actions.length
            },
            () => {
                if (this._randomGenerator.nextRandom() > .5) {
                    this.robot.toggleActionHand(this.currentToggleIndex)
                }
                this.currentToggleIndex++

                return this.currentToggleIndex >= this.robot.actions.length
            },
            () => {
                this.robot.commit()
                this.currentActionIndex = 0
                this.currentToggleIndex = 0
                this.currentPhase = 0

                return false
            },
        ]

        const hasFinishedPhase = phases[this.currentPhase]()

        if (hasFinishedPhase) this.currentPhase++
    }
}