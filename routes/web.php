<?php

use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserPreferenceController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('assignments');
})->middleware('auth')->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/assignments', [AssignmentController::class, 'index'])->name('assignments.index');
    Route::get('/assignments/export', [AssignmentController::class, 'export'])->name('assignments.export');
    Route::post('/assignments', [AssignmentController::class, 'store'])->name('assignments.store');
    Route::patch('/assignments/{assignment}', [AssignmentController::class, 'update'])->name('assignments.update');
    Route::delete('/assignments/{assignment}', [AssignmentController::class, 'destroy'])->name('assignments.destroy');
    Route::put('/preferences/theme', [UserPreferenceController::class, 'updateTheme'])->name('preferences.theme.update');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
