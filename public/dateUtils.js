/**
 * ZeroWaste - Shared Date & Expiry Utilities
 * Calendar-day based calculations avoiding UTC conversion, time-zone, and DST skews.
 * Works seamlessly in both browser environments and Node.js CommonJS runtimes.
 */

(function (root, factory) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory();
    } else {
        const exported = factory();
        root.parseCalendarDate = exported.parseCalendarDate;
        root.calculateExpiryStatus = exported.calculateExpiryStatus;
        root.formatCalendarDate = exported.formatCalendarDate;
        root.ExpiryUtils = exported;
    }
}(typeof self !== "undefined" ? self : this, function () {

    /**
     * Parse a date input into pure calendar components { year, month, day } (1-indexed month: 1..12, day: 1..31).
     * Strictly avoids treating YYYY-MM-DD as UTC midnight timestamp.
     *
     * @param {string|Date|Object} dateInput
     * @returns {{ year: number, month: number, day: number }|null}
     */
    function parseCalendarDate(dateInput) {
        if (!dateInput) return null;

        if (typeof dateInput === "object" && dateInput !== null && !(dateInput instanceof Date)) {
            if (typeof dateInput.year === "number" && typeof dateInput.month === "number" && typeof dateInput.day === "number") {
                return { year: dateInput.year, month: dateInput.month, day: dateInput.day };
            }
        }

        // String parsing: extract YYYY-MM-DD
        if (typeof dateInput === "string") {
            const trimmed = dateInput.trim();
            const datePart = trimmed.split("T")[0];
            const match = datePart.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
            if (match) {
                const year = parseInt(match[1], 10);
                const month = parseInt(match[2], 10);
                const day = parseInt(match[3], 10);

                if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                    const testDate = new Date(year, month - 1, day);
                    if (
                        testDate.getFullYear() === year &&
                        testDate.getMonth() === month - 1 &&
                        testDate.getDate() === day
                    ) {
                        return { year, month, day };
                    }
                }
                return null;
            }

            // Fallback for general valid date string
            const parsed = new Date(trimmed);
            if (!isNaN(parsed.getTime())) {
                return {
                    year: parsed.getFullYear(),
                    month: parsed.getMonth() + 1,
                    day: parsed.getDate()
                };
            }
            return null;
        }

        // Date instance parsing using local calendar fields
        if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
            return {
                year: dateInput.getFullYear(),
                month: dateInput.getMonth() + 1,
                day: dateInput.getDate()
            };
        }

        return null;
    }

    /**
     * Format calendar date components into standard YYYY-MM-DD
     *
     * @param {string|Date|Object} dateInput
     * @returns {string}
     */
    function formatCalendarDate(dateInput) {
        if (!dateInput) return "";
        const parsed = parseCalendarDate(dateInput);
        if (!parsed) return "";
        const m = String(parsed.month).padStart(2, "0");
        const d = String(parsed.day).padStart(2, "0");
        return `${parsed.year}-${m}-${d}`;
    }

    /**
     * Calculate expiry status between an expiryDate and a reference baseDate (defaults to current date).
     * Both dates are evaluated purely by their calendar-day values, preventing errors from
     * hours, minutes, UTC offset discrepancies, or daylight-saving adjustments.
     *
     * @param {string|Date} expiryDateInput - Expiry date string (e.g. "2026-10-15") or Date
     * @param {string|Date} [baseDate=new Date()] - Reference date (current local calendar date)
     * @returns {Object} Expiry status breakdown
     */
    function calculateExpiryStatus(expiryDateInput, baseDate = new Date()) {
        const exp = parseCalendarDate(expiryDateInput);
        const base = parseCalendarDate(baseDate);

        if (!exp || !base) {
            return {
                isValid: false,
                diffDays: null,
                statusText: "Invalid Date",
                statusColor: "#9ca3af",
                isExpired: false,
                isExpiringToday: false,
                isExpiringTomorrow: false,
                isExpiringSoon: false,
                isNotificationEligible: false
            };
        }

        // Date.UTC with explicit calendar year, monthIndex, day guarantees exact 86,400,000 ms per calendar day
        const expUtc = Date.UTC(exp.year, exp.month - 1, exp.day);
        const baseUtc = Date.UTC(base.year, base.month - 1, base.day);
        const diffDays = Math.round((expUtc - baseUtc) / (1000 * 60 * 60 * 24));

        const isExpired = diffDays < 0;
        const isExpiringToday = diffDays === 0;
        const isExpiringTomorrow = diffDays === 1;
        const isExpiringSoon = diffDays >= 0 && diffDays <= 3;
        // Eligible for high-priority notification if expiring today or tomorrow
        const isNotificationEligible = diffDays === 0 || diffDays === 1;

        let statusText = "";
        let statusColor = "#2e8b57";

        if (isExpired) {
            const daysAgo = Math.abs(diffDays);
            statusText = daysAgo === 1 ? "Expired 1 day ago" : `Expired ${daysAgo} days ago`;
            statusColor = "#e53935";
        } else if (isExpiringToday) {
            statusText = "Expires today";
            statusColor = "#dc2626";
        } else if (isExpiringTomorrow) {
            statusText = "Expires tomorrow";
            statusColor = "#f59e0b";
        } else if (diffDays <= 3) {
            statusText = `Expires in ${diffDays} days`;
            statusColor = "#f59e0b";
        } else {
            statusText = `Expires in ${diffDays} days`;
            statusColor = "#2e8b57";
        }

        return {
            isValid: true,
            diffDays,
            statusText,
            statusColor,
            isExpired,
            isExpiringToday,
            isExpiringTomorrow,
            isExpiringSoon,
            isNotificationEligible
        };
    }

    return {
        parseCalendarDate,
        formatCalendarDate,
        calculateExpiryStatus
    };
}));
