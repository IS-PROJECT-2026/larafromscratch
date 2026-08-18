<?php

namespace App\Models;

use Database\Factories\AssignmentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Assignment extends Model
{
    /** @use HasFactory<AssignmentFactory> */
    use HasFactory;

    protected $fillable = ['title', 'course', 'due_date', 'priority', 'estimated_minutes', 'completed'];

    protected $attributes = [
        'priority' => 'medium',
        'completed' => false,
    ];

    protected function casts(): array
    {
        return ['due_date' => 'date', 'completed' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
