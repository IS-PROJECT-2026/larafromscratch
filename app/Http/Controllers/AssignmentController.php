<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAssignmentRequest;
use App\Http\Requests\UpdateAssignmentRequest;
use App\Models\Assignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AssignmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $assignments = $request->user()->assignments()->orderBy('due_date')->orderBy('created_at')->get();

        return response()->json($assignments->map(fn (Assignment $assignment) => $this->payload($assignment)));
    }

    public function store(StoreAssignmentRequest $request): JsonResponse
    {
        $assignment = $request->user()->assignments()->create($request->validated());

        return response()->json($this->payload($assignment), Response::HTTP_CREATED);
    }

    public function update(UpdateAssignmentRequest $request, Assignment $assignment): JsonResponse
    {
        $this->ensureOwner($request, $assignment);
        $assignment->update($request->validated());

        return response()->json($this->payload($assignment->fresh()));
    }

    public function destroy(Request $request, Assignment $assignment): Response
    {
        $this->ensureOwner($request, $assignment);
        $assignment->delete();

        return response()->noContent();
    }

    private function ensureOwner(Request $request, Assignment $assignment): void
    {
        abort_unless($assignment->user_id === $request->user()->id, Response::HTTP_NOT_FOUND);
    }

    private function payload(Assignment $assignment): array
    {
        return [
            'id' => $assignment->id,
            'title' => $assignment->title,
            'course' => $assignment->course,
            'dueDate' => $assignment->due_date->toDateString(),
            'priority' => $assignment->priority,
            'completed' => $assignment->completed,
            'createdAt' => $assignment->created_at->toISOString(),
            'updatedAt' => $assignment->updated_at->toISOString(),
        ];
    }
}
