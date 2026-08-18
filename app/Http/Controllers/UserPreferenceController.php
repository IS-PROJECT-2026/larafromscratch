<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserPreferenceController extends Controller
{
    public function updateTheme(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'theme' => ['required', 'string', Rule::in(['system', 'light', 'dark'])],
        ]);

        $request->user()->update(['theme_preference' => $validated['theme']]);

        return response()->json(['theme' => $request->user()->fresh()->theme_preference]);
    }
}
