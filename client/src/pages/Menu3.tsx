import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Wrench } from "lucide-react";

export default function Menu3() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">메뉴3</h1>
        <p className="text-gray-600 text-sm mt-1">
          메뉴3 기능이 여기에 구현됩니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            메뉴3 컨텐츠
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              메뉴3 기능
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              이곳에 메뉴3과 관련된 기능을 구현하세요. 
              모든 사용자가 접근할 수 있는 기능입니다.
            </p>
            <Button variant="secondary">
              <Wrench className="mr-2 h-4 w-4" />
              설정 관리
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
