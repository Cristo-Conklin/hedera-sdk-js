import proto from "@hashgraph/proto";
import Long from "long";

export default class Timestamp {
    /**
     * @param {number} seconds
     * @param {number} nanos
     */
    constructor(seconds, nanos) {
        /** @readonly */
        this.seconds = seconds;

        /** @readonly */
        this.nanos = nanos;

        Object.freeze(this);
    }

    /**
     * @returns {Timestamp}
     */
    static generate() {
        let now = Date.now();
        let jitter = (Math.random() * 5000) + 8000

        return Timestamp.fromDate(now - jitter);
    }

    /**
     * @param {string | number | Date} date
     * @returns {Timestamp}
     */
    static fromDate(date) {
        let ms;

        if (typeof date === "number") {
            ms = date;
        } else if (typeof date === "string") {
            ms = Date.parse(date);
        } else if (date instanceof Date) {
            ms = date.getTime();
        } else {
            throw new TypeError(
                `invalid type '${typeof date}' for 'data', expected 'Date'`
            );
        }

        const seconds = Math.floor(ms / 1000);
        const nanos = Math.floor(ms % 1000) * 1_000_000;

        return new Timestamp(seconds, nanos);
    }

    /**
     * @returns {Date}
     */
    toDate() {
        return new Date(
            this.seconds * 1000 + Math.floor(this.nanos / 1_000_000)
        );
    }

    /**
     * @returns {proto.ITimestamp}
     */
    _toProtobuf() {
        return {
            seconds: this.seconds,
            nanos: this.nanos,
        };
    }

    /**
     * @param {proto.ITimestamp} timestamp
     * @returns {Timestamp}
     */
    static _fromProtobuf(timestamp) {
        return new Timestamp(
            timestamp.seconds instanceof Long
                ? timestamp.seconds.toInt()
                : timestamp.seconds ?? 0,

            timestamp.nanos ?? 0
        );
    }
}