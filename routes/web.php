<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('assignments');
});

Route::get('/assignments', function () {
    return view('assignments');
});
