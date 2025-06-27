import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Crown, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Menu4() {
  const { user } = useAuth();

  if (user?.role !== "MANAGER") {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">메뉴4</h1>
          <p className="text-gray-600 text-sm mt-1">
            관리자 전용 기능입니다.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                접근 권한이 없습니다
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                이 페이지는 MANAGER 권한이 필요합니다. 
                시스템 관리자에게 권한 승격을 요청하세요.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">메뉴4</h1>
        <p className="text-gray-600 text-sm mt-1">
          관리자 전용 기능입니다.
        </p>
      </div>

      <Alert className="mb-6">
        <Crown className="h-4 w-4" />
        <AlertDescription>
          이 메뉴는 MANAGER 권한을 가진 사용자만 접근할 수 있습니다.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            관리자 전용 컨텐츠
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              메뉴4 관리자 기능
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              이곳에 관리자 전용 기능을 구현하세요. 
              ENGINEER 권한 사용자는 접근할 수 없습니다.
            </p>
            <Button>
              <Shield className="mr-2 h-4 w-4" />
              관리자 작업 실행
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
