<?php

namespace Database\Factories;

use App\Models\Assignment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Assignment> */
class AssignmentFactory extends Factory
{
    protected $model = Assignment::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(3),
            'course' => fake()->randomElement(['Biology', 'Calculus', 'History']),
            'due_date' => fake()->dateTimeBetween('today', '+3 months')->format('Y-m-d'),
            'priority' => fake()->randomElement(['high', 'medium', 'low']),
            'completed' => false,
        ];
    }
}
