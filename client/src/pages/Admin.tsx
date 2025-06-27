import { AdminPanel } from "@/components/AdminPanel";

export default function Admin() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">관리자 패널</h1>
        <p className="text-gray-600 text-sm mt-1">
          사용자 권한을 관리하고 시스템을 설정합니다.
        </p>
      </div>

      <AdminPanel />
    </main>
  );
}
