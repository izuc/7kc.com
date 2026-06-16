<?php
declare(strict_types=1);

namespace SevenKC\Tests;

use PHPUnit\Framework\TestCase as BaseTestCase;
use SevenKC\Action\MealPlan\MealPlanDates;

final class MealPlanDatesTest extends BaseTestCase
{
    public function testIsValidRejectsJunkAndImpossibleDates(): void
    {
        $this->assertTrue(MealPlanDates::isValid('2026-06-15'));
        $this->assertFalse(MealPlanDates::isValid('notadate'));
        $this->assertFalse(MealPlanDates::isValid('2026-13-01')); // month 13
        $this->assertFalse(MealPlanDates::isValid('2026-02-30')); // impossible day
        $this->assertFalse(MealPlanDates::isValid('2026-6-1'));   // not zero-padded
    }

    public function testValidWeekStartSnapsAnyInWeekDateToItsMonday(): void
    {
        // 2026-06-17 is a Wednesday → Monday of that week is 2026-06-15.
        $this->assertSame('2026-06-15', MealPlanDates::validWeekStart('2026-06-17'));
        $this->assertSame('2026-06-15', MealPlanDates::validWeekStart('2026-06-21')); // Sunday → same Monday
        $this->assertSame('2026-06-15', MealPlanDates::validWeekStart('2026-06-15')); // Monday → itself
    }

    public function testAddDays(): void
    {
        $this->assertSame('2026-06-21', MealPlanDates::addDays('2026-06-15', 6));
        $this->assertSame('2026-07-01', MealPlanDates::addDays('2026-06-30', 1));
    }
}
