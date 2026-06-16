<?php
declare(strict_types=1);

namespace SevenKC\Action\MealPlan;

/** Shared date helpers for the week planner. ISO 'YYYY-MM-DD' throughout. */
final class MealPlanDates
{
    public static function isValid(string $date): bool
    {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) return false;
        [$y, $m, $d] = array_map('intval', explode('-', $date));
        return checkdate($m, $d, $y);
    }

    /** The Monday of the week containing the supplied date (if valid), else the current Monday.
     *  Snapping to Monday guarantees the Mon→Sun window even if a client sends a mid-week date. */
    public static function validWeekStart(?string $date): string
    {
        $ref = $date !== null && self::isValid($date) ? (int)strtotime($date) : (int)strtotime('monday this week');
        return date('Y-m-d', (int)strtotime('monday this week', $ref));
    }

    public static function addDays(string $date, int $days): string
    {
        return date('Y-m-d', (int)strtotime("$date +$days days"));
    }
}
