<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssignmentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/')->assertRedirect(route('login'));
        $this->getJson('/assignments')->assertUnauthorized();
    }

    public function test_a_user_can_register_and_is_redirected_to_the_tracker(): void
    {
        $response = $this->post('/register', [
            'name' => 'Ada Lovelace',
            'email' => 'ada@example.test',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', ['email' => 'ada@example.test']);
    }

    public function test_guest_account_pages_link_to_each_other(): void
    {
        $this->get('/login')
            ->assertOk()
            ->assertSee(route('register'))
            ->assertSee(route('password.request'));

        $this->get('/register')
            ->assertOk()
            ->assertSee(route('login'));

        $this->get('/forgot-password')
            ->assertOk()
            ->assertSee(route('login'))
            ->assertSee(route('register'));
    }

    public function test_assignments_are_scoped_to_the_authenticated_user_and_sorted_by_due_date(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $later = Assignment::factory()->for($user)->create(['due_date' => '2026-10-20']);
        $earlier = Assignment::factory()->for($user)->create(['due_date' => '2026-09-10']);
        Assignment::factory()->for($otherUser)->create();

        $response = $this->actingAs($user)->getJson('/assignments');

        $response->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.id', $earlier->id)
            ->assertJsonPath('1.id', $later->id)
            ->assertJsonPath('0.dueDate', '2026-09-10')
            ->assertJsonStructure([['id', 'title', 'course', 'dueDate', 'priority', 'estimatedMinutes', 'completed', 'createdAt', 'updatedAt']]);
    }

    public function test_a_user_can_create_and_complete_an_assignment(): void
    {
        $user = User::factory()->create();

        $created = $this->actingAs($user)->postJson('/assignments', [
            'title' => 'Chapter 5 Problem Set',
            'course' => 'Calculus II',
            'dueDate' => '2026-09-10',
            'priority' => 'high',
            'estimatedMinutes' => 180,
        ]);

        $created->assertCreated()
            ->assertJsonPath('title', 'Chapter 5 Problem Set')
            ->assertJsonPath('priority', 'high')
            ->assertJsonPath('estimatedMinutes', 180)
            ->assertJsonPath('completed', false);

        $assignmentId = $created->json('id');
        $this->assertDatabaseHas('assignments', [
            'id' => $assignmentId,
            'user_id' => $user->id,
            'priority' => 'high',
            'estimated_minutes' => 180,
            'completed' => 0,
        ]);
        $this->assertSame('2026-09-10', Assignment::findOrFail($assignmentId)->due_date->toDateString());

        $this->actingAs($user)->patchJson("/assignments/{$assignmentId}", ['completed' => true])
            ->assertOk()
            ->assertJsonPath('completed', true);

        $this->assertDatabaseHas('assignments', ['id' => $assignmentId, 'completed' => 1]);
    }

    public function test_assignment_validation_and_database_defaults_are_enforced(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/assignments', [
            'title' => '',
            'course' => 'A course',
            'dueDate' => 'not-a-date',
            'priority' => 'urgent',
            'estimatedMinutes' => -1,
        ])->assertUnprocessable()->assertJsonValidationErrors(['title', 'due_date', 'priority', 'estimated_minutes']);

        $assignment = Assignment::factory()->for($user)->create(['priority' => 'medium']);
        $this->assertSame('medium', $assignment->priority);
    }

    public function test_users_cannot_modify_or_delete_other_users_assignments(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $assignment = Assignment::factory()->for($owner)->create();

        $this->actingAs($intruder)->patchJson("/assignments/{$assignment->id}", ['completed' => true])->assertNotFound();
        $this->actingAs($intruder)->deleteJson("/assignments/{$assignment->id}")->assertNotFound();
        $this->assertDatabaseHas('assignments', ['id' => $assignment->id, 'user_id' => $owner->id]);
    }

    public function test_assignments_are_deleted_when_their_user_is_deleted(): void
    {
        $user = User::factory()->create();
        $assignment = Assignment::factory()->for($user)->create();

        $user->delete();

        $this->assertDatabaseMissing('assignments', ['id' => $assignment->id]);
    }

    public function test_a_user_can_export_only_their_assignments_as_csv(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        Assignment::factory()->for($user)->create([
            'title' => 'Essay, final draft',
            'course' => 'History',
            'due_date' => '2026-09-10',
            'estimated_minutes' => 180,
            'completed' => true,
        ]);
        Assignment::factory()->for($otherUser)->create(['title' => 'Private work']);

        $response = $this->actingAs($user)->get('/assignments/export');

        $response
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8')
            ->assertHeader('content-disposition', 'attachment; filename=assignments.csv');

        $this->assertStringContainsString('Title,Course,"Due date",Priority,"Study estimate (minutes)",Completed', $response->streamedContent());
        $this->assertStringContainsString('"Essay, final draft",History,2026-09-10', $response->streamedContent());
        $this->assertStringNotContainsString('Private work', $response->streamedContent());
    }

    public function test_a_user_can_save_their_theme_preference(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->putJson('/preferences/theme', ['theme' => 'dark'])
            ->assertOk()
            ->assertJsonPath('theme', 'dark');

        $this->assertDatabaseHas('users', ['id' => $user->id, 'theme_preference' => 'dark']);
    }
}
