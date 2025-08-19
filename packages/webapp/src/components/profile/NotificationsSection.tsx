"use client";

export default function NotificationsSection() {
  return (
    <section>
      <h3 className="text-xl font-bold text-gray-700 mb-2">Notifications</h3>
      <p className="text-gray-500 mb-6 text-sm">Stay updated on event activity and campus highlights.</p>

      <div className="rounded-lg border border-dashed p-6 text-center">
        <div className="text-3xl mb-2">🔔</div>
        <div className="font-semibold text-gray-800">Coming soon</div>
        <p className="text-sm text-gray-500 mt-1">
          You’ll receive alerts for RSVPs, event updates, and more.
        </p>
      </div>
    </section>
  );
}
