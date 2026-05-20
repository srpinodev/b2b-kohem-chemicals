<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService) {}

    public function index()
    {
        $user = auth()->user();

        return response()->json(
            $this->notificationService->forUser($user)
        );
    }

    public function markRead(DatabaseNotification $notification)
    {
        $user = auth()->user();

        try {
            $this->notificationService->markRead($notification, $user);
        } catch (\RuntimeException) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json(['message' => 'Notification marked as read.']);
    }

    public function markAllRead()
    {
        $user = auth()->user();
        $count = $this->notificationService->markAllRead($user);

        return response()->json(['marked' => $count]);
    }
}
