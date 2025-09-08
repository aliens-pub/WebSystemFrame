import { Button } from "@/components/ui/button";
import { Table } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface GuideDBItem {
  id: number;
  item: string;
  comment: string;
  standard_TAT: number;
  phpsi_1: string | null;
  phpsi_2: string | null;
  phpsi_3: string | null;
  phpsi_4: string | null;
  phpsi_5: string | null;
  phpsi_6: string | null;
  phpsi_7: string | null;
  phpsi_8: string | null;
  phpsi_9: string | null;
  phpsi_10: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateTableButtonProps {
  selectedLineId: string;
  selectedPpid: string;
  selectedChangeRequestItems: string[];
  selectedApprover: string;
  onTableGenerated: (tableHtml: string) => void;
  isVisible: boolean;
}

export default function CreateTableButton({
  selectedLineId,
  selectedPpid,
  selectedChangeRequestItems,
  selectedApprover,
  onTableGenerated,
  isVisible
}: CreateTableButtonProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  // GuideDB 항목 조회
  const { data: guideDBItems, isLoading: isGuideDBLoading } = useQuery<GuideDBItem[]>({
    queryKey: ['/api/guide-db'],
    queryFn: async () => {
      const response = await fetch('/api/guide-db', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('GuideDB 데이터를 불러오는데 실패했습니다.');
      }
      return response.json();
    },
  });

  // 표 생성 함수
  const generateTable = () => {
    if (!selectedLineId || !selectedPpid || selectedChangeRequestItems.length === 0 || !selectedApprover || !user) {
      toast({
        title: "필수 선택 항목 누락",
        description: "Line ID, PPID, 변경 의뢰 항목, 결재자를 모두 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 표 HTML 생성
    let tableHtml = `
      <table border="1" style="border-collapse: collapse; width: 100%; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">line</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">담당자 (정)</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">담당자 (부)</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">item</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">comment</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">standard_tat</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">phpsi_1</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">phpsi_2</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">phpsi_3</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">phpsi_4</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">phpsi_5</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">phpsi_6</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">phpsi_7</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">phpsi_8</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">phpsi_9</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">phpsi_10</th>
          </tr>
        </thead>
        <tbody>`;

    // 선택된 변경 의뢰 항목들로 행 생성
    selectedChangeRequestItems.forEach((item, index) => {
      // 디버깅을 위한 로그
      console.log('Processing item:', item);
      console.log('Available GuideDB items:', guideDBItems);
      
      // GuideDB에서 매칭되는 항목 찾기 (정확한 일치)
      const guideItem = guideDBItems?.find(guide => 
        guide.item.trim().toLowerCase() === item.trim().toLowerCase()
      );
      
      console.log('Found guide item:', guideItem);
      
      const comment = guideItem?.comment || '데이터 없음';
      const standardTat = guideItem?.standard_TAT?.toString() || '0';
      
      // phpsi 필드들 추출
      const phpsi1 = guideItem?.phpsi_1 || '-';
      const phpsi2 = guideItem?.phpsi_2 || '-';
      const phpsi3 = guideItem?.phpsi_3 || '-';
      const phpsi4 = guideItem?.phpsi_4 || '-';
      const phpsi5 = guideItem?.phpsi_5 || '-';
      const phpsi6 = guideItem?.phpsi_6 || '-';
      const phpsi7 = guideItem?.phpsi_7 || '-';
      const phpsi8 = guideItem?.phpsi_8 || '-';
      const phpsi9 = guideItem?.phpsi_9 || '-';
      const phpsi10 = guideItem?.phpsi_10 || '-';
      
      console.log('Comment:', comment, 'Standard TAT:', standardTat);
      console.log('PHPSI values:', { phpsi1, phpsi2, phpsi3, phpsi4, phpsi5, phpsi6, phpsi7, phpsi8, phpsi9, phpsi10 });

      tableHtml += `
        <tr>
          ${index === 0 ? `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;" rowspan="${selectedChangeRequestItems.length}">${selectedLineId}</td>` : ''}
          ${index === 0 ? `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;" rowspan="${selectedChangeRequestItems.length}">${user.username}</td>` : ''}
          ${index === 0 ? `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;" rowspan="${selectedChangeRequestItems.length}">${selectedApprover}</td>` : ''}
          <td style="padding: 8px; border: 1px solid #ddd;">${item}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${comment}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${standardTat}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${phpsi1}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${phpsi2}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${phpsi3}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${phpsi4}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${phpsi5}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${phpsi6}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${phpsi7}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${phpsi8}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${phpsi9}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${phpsi10}</td>
        </tr>`;
    });

    tableHtml += `
        </tbody>
      </table>`;

    // 생성된 표를 부모 컴포넌트에 전달
    onTableGenerated(tableHtml);

    toast({
      title: "표 생성 완료",
      description: "선택한 항목들로 표가 생성되어 [표 1] 영역에 추가되었습니다.",
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex justify-end">
      <Button 
        onClick={generateTable}
        disabled={isGuideDBLoading}
        className="gap-2"
        variant="secondary"
      >
        <Table className="h-4 w-4" />
        {isGuideDBLoading ? "데이터 로딩 중..." : "표 생성"}
      </Button>
    </div>
  );
}