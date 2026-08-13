<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }

    public function test_the_assignments_page_is_available(): void
    {
        $response = $this->get('/assignments');

        $response
            ->assertStatus(200)
            ->assertSee('Assignment Tracker');
    }
}
