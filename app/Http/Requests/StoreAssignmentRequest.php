<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'due_date' => $this->input('dueDate'),
            'estimated_minutes' => $this->input('estimatedMinutes'),
        ]);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:120'],
            'course' => ['required', 'string', 'max:80'],
            'due_date' => ['required', 'date_format:Y-m-d'],
            'priority' => ['required', Rule::in(['high', 'medium', 'low'])],
            'estimated_minutes' => ['nullable', 'integer', 'min:0', 'max:60000'],
        ];
    }
}
