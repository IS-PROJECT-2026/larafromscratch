<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $values = [];

        if ($this->has('dueDate')) {
            $values['due_date'] = $this->input('dueDate');
        }

        if ($this->has('estimatedMinutes')) {
            $values['estimated_minutes'] = $this->input('estimatedMinutes');
        }

        $this->merge($values);
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:120'],
            'course' => ['sometimes', 'required', 'string', 'max:80'],
            'due_date' => ['sometimes', 'required', 'date_format:Y-m-d'],
            'priority' => ['sometimes', 'required', Rule::in(['high', 'medium', 'low'])],
            'estimated_minutes' => ['nullable', 'integer', 'min:0', 'max:60000'],
            'completed' => ['sometimes', 'required', 'boolean'],
        ];
    }
}
