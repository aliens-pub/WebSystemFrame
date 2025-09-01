import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GuideDBItem {
  id: number;
  item: string;
  standard_TAT: number;
  comment: string | null;
  reference: string | null;
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

interface PendingChange {
  id: number;
  column: string;
  oldValue: any;
  newValue: any;
}

const DatabaseEdit: React.FC = () => {
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [editingCell, setEditingCell] = useState<{rowId: number; column: string; value: string} | null>(null);
  const [newItem, setNewItem] = useState<Partial<GuideDBItem>>({
    item: '',
    standard_TAT: 1,
    comment: '',
    reference: '',
    phpsi_1: '',
    phpsi_2: '',
    phpsi_3: '',
    phpsi_4: '',
    phpsi_5: '',
    phpsi_6: '',
    phpsi_7: '',
    phpsi_8: '',
    phpsi_9: '',
    phpsi_10: ''
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Guide DB 데이터 조회
  const { data: guideData = [], isLoading, error } = useQuery<GuideDBItem[]>({
    queryKey: ['/api/guide-db'],
    queryFn: async () => {
      const response = await fetch('/api/guide-db');
      if (!response.ok) {
        throw new Error('Failed to fetch guide data');
      }
      const data = await response.json();
      return data;
    }
  });

  // 일괄 업데이트 뮤테이션
  const bulkUpdateMutation = useMutation({
    mutationFn: async (changes: PendingChange[]) => {
      setIsUpdating(true);
      const updatePromises = changes.map(change => {
        const item = guideData.find(item => item.id === change.id);
        if (!item) return Promise.resolve();
        
        const updatedData = {
          ...item,
          [change.column]: change.column === 'standard_TAT' 
            ? parseInt(change.newValue) || 1 
            : change.newValue
        };
        
        return fetch(`/api/guide-db/${change.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedData),
        });
      });
      
      const results = await Promise.all(updatePromises);
      const failedUpdates = results.filter(result => result && !result.ok);
      
      if (failedUpdates.length > 0) {
        throw new Error(`${failedUpdates.length}개 항목 업데이트 실패`);
      }
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guide-db'] });
      setPendingChanges([]);
      setIsUpdating(false);
      toast({
        title: "업데이트 완료",
        description: `${pendingChanges.length}개 항목이 성공적으로 업데이트되었습니다.`,
      });
    },
    onError: (error: Error) => {
      setIsUpdating(false);
      toast({
        variant: "destructive",
        title: "업데이트 실패",
        description: error.message,
      });
    }
  });

  // 생성 뮤테이션
  const createMutation = useMutation({
    mutationFn: async (data: Partial<GuideDBItem>) => {
      const response = await fetch('/api/guide-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create item');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guide-db'] });
      setNewItem({
        item: '',
        standard_TAT: 1,
        comment: '',
        reference: '',
        phpsi_1: '',
        phpsi_2: '',
        phpsi_3: '',
        phpsi_4: '',
        phpsi_5: '',
        phpsi_6: '',
        phpsi_7: '',
        phpsi_8: '',
        phpsi_9: '',
        phpsi_10: ''
      });
      setIsAddDialogOpen(false);
      toast({
        title: "항목 추가 완료",
        description: "새 항목이 성공적으로 추가되었습니다.",
      });
    }
  });

  // 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/guide-db/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guide-db'] });
      // 삭제된 항목의 pending changes도 제거
      setPendingChanges(prev => prev.filter(change => change.id !== deleteMutation.variables));
      toast({
        title: "항목 삭제 완료",
        description: "항목이 성공적으로 삭제되었습니다.",
      });
    }
  });

  // 셀 클릭 핸들러
  const handleCellClick = (rowId: number, column: string, currentValue: any) => {
    if (column === 'id' || column === 'created_at' || column === 'updated_at') {
      return;
    }
    
    setEditingCell({
      rowId,
      column,
      value: currentValue?.toString() || ''
    });
  };

  // 셀 값 변경 핸들러
  const handleCellChange = (value: string) => {
    if (editingCell) {
      setEditingCell({
        ...editingCell,
        value
      });
    }
  };

  // 셀 편집 완료 (임시 저장)
  const handleCellComplete = () => {
    if (!editingCell) return;

    const item = guideData.find(item => item.id === editingCell.rowId);
    if (!item) return;

    const oldValue = item[editingCell.column as keyof GuideDBItem];
    const newValue = editingCell.column === 'standard_TAT' 
      ? parseInt(editingCell.value) || 1 
      : editingCell.value;

    // 값이 실제로 변경되었는지 확인
    if (oldValue !== newValue) {
      // 기존 pending change가 있다면 업데이트, 없다면 추가
      setPendingChanges(prev => {
        const existingChangeIndex = prev.findIndex(
          change => change.id === editingCell.rowId && change.column === editingCell.column
        );
        
        if (existingChangeIndex >= 0) {
          const updated = [...prev];
          updated[existingChangeIndex] = {
            id: editingCell.rowId,
            column: editingCell.column,
            oldValue: updated[existingChangeIndex].oldValue, // 원래의 oldValue 유지
            newValue
          };
          return updated;
        } else {
          return [...prev, {
            id: editingCell.rowId,
            column: editingCell.column,
            oldValue,
            newValue
          }];
        }
      });
    }

    setEditingCell(null);
  };

  // 셀 편집 취소
  const handleCellCancel = () => {
    setEditingCell(null);
  };

  // 행 삭제
  const handleDeleteRow = (id: number) => {
    const item = guideData.find(item => item.id === id);
    if (window.confirm(`"${item?.item}" 항목을 삭제하시겠습니까?`)) {
      deleteMutation.mutate(id);
    }
  };

  // 새 항목 추가
  const handleAddItem = () => {
    createMutation.mutate(newItem);
  };

  // 일괄 업데이트 실행
  const handleBulkUpdate = () => {
    if (pendingChanges.length === 0) return;
    bulkUpdateMutation.mutate(pendingChanges);
  };

  // 변경사항 취소
  const handleCancelChanges = () => {
    setPendingChanges([]);
    toast({
      title: "변경사항 취소됨",
      description: "모든 변경사항이 취소되었습니다.",
    });
  };

  // 현재 값 가져오기 (pending changes 반영)
  const getCurrentValue = (item: GuideDBItem, column: string) => {
    const pendingChange = pendingChanges.find(
      change => change.id === item.id && change.column === column
    );
    
    if (pendingChange) {
      return pendingChange.newValue;
    }
    
    return item[column as keyof GuideDBItem];
  };

  // 셀이 변경되었는지 확인
  const isCellChanged = (itemId: number, column: string) => {
    return pendingChanges.some(
      change => change.id === itemId && change.column === column
    );
  };

  const columns = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'item', label: '변경 아이템', width: '300px' },
    { key: 'standard_TAT', label: '표준 TAT(일)', width: '160px' },
    { key: 'comment', label: '코멘트', width: '400px' },
    { key: 'reference', label: '참고사항', width: '250px' },
    { key: 'phpsi_1', label: 'PHPSI 1', width: '180px' },
    { key: 'phpsi_2', label: 'PHPSI 2', width: '180px' },
    { key: 'phpsi_3', label: 'PHPSI 3', width: '180px' },
    { key: 'phpsi_4', label: 'PHPSI 4', width: '180px' },
    { key: 'phpsi_5', label: 'PHPSI 5', width: '180px' },
    { key: 'phpsi_6', label: 'PHPSI 6', width: '180px' },
    { key: 'phpsi_7', label: 'PHPSI 7', width: '180px' },
    { key: 'phpsi_8', label: 'PHPSI 8', width: '180px' },
    { key: 'phpsi_9', label: 'PHPSI 9', width: '180px' },
    { key: 'phpsi_10', label: 'PHPSI 10', width: '180px' },
  ];

  const renderCell = (item: GuideDBItem, column: { key: string; label: string }) => {
    const currentValue = getCurrentValue(item, column.key);
    const isEditing = editingCell?.rowId === item.id && editingCell?.column === column.key;
    const isChanged = isCellChanged(item.id, column.key);

    if (column.key === 'id') {
      return <span className="text-gray-500 font-mono">{currentValue}</span>;
    }

    if (isEditing) {
      return (
        <div className="w-full">
          <Input
            value={editingCell.value}
            onChange={(e) => handleCellChange(e.target.value)}
            className="h-8 text-sm border-blue-400 focus:ring-blue-500"
            autoFocus
            onBlur={handleCellComplete}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCellComplete();
              } else if (e.key === 'Escape') {
                handleCellCancel();
              }
            }}
          />
        </div>
      );
    }

    return (
      <div
        className={`cursor-pointer hover:bg-gray-50 p-2 rounded min-h-[32px] flex items-center transition-colors ${
          isChanged ? 'bg-amber-50 border-l-4 border-l-amber-400' : ''
        }`}
        onClick={() => handleCellClick(item.id, column.key, currentValue)}
        title={isChanged ? '변경됨 - 업데이트 버튼을 눌러 저장하세요' : '클릭하여 편집'}
      >
        <span className={`text-sm ${isChanged ? 'font-medium text-amber-800' : ''}`}>
          {currentValue?.toString() || <span className="text-gray-400">비어있음</span>}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600">데이터를 불러오는 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
              <p className="text-red-600 font-medium">데이터 로드 중 오류가 발생했습니다</p>
              <p className="text-gray-500 text-sm mt-2">페이지를 새로고침하거나 관리자에게 문의하세요</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span>DB 수정</span>
                {pendingChanges.length > 0 && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    {pendingChanges.length}개 변경됨
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-2">
                Guide_DB 테이블을 엑셀처럼 편집할 수 있습니다. 셀을 클릭하여 수정한 후 "업데이트" 버튼을 눌러 저장하세요.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {pendingChanges.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelChanges}
                    disabled={isUpdating}
                  >
                    변경사항 취소
                  </Button>
                  <Button
                    onClick={handleBulkUpdate}
                    disabled={isUpdating || pendingChanges.length === 0}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        업데이트 중...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        업데이트 ({pendingChanges.length})
                      </>
                    )}
                  </Button>
                </div>
              )}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    새 항목 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>새 항목 추가</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="item">변경 아이템 *</Label>
                      <Input
                        id="item"
                        value={newItem.item || ''}
                        onChange={(e) => setNewItem({...newItem, item: e.target.value})}
                        placeholder="예: 포트 번호 변경"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="standard_TAT">표준 TAT(일) *</Label>
                      <Input
                        id="standard_TAT"
                        type="number"
                        min="1"
                        value={newItem.standard_TAT || 1}
                        onChange={(e) => setNewItem({...newItem, standard_TAT: parseInt(e.target.value) || 1})}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="comment">코멘트</Label>
                      <Input
                        id="comment"
                        value={newItem.comment || ''}
                        onChange={(e) => setNewItem({...newItem, comment: e.target.value})}
                        placeholder="상세한 설명을 입력하세요"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="reference">참고사항</Label>
                      <Input
                        id="reference"
                        value={newItem.reference || ''}
                        onChange={(e) => setNewItem({...newItem, reference: e.target.value})}
                        placeholder="담당자, 연락처 등"
                      />
                    </div>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <div key={num} className="space-y-2">
                        <Label htmlFor={`phpsi_${num}`}>PHPSI {num}</Label>
                        <Input
                          id={`phpsi_${num}`}
                          value={newItem[`phpsi_${num}` as keyof typeof newItem] as string || ''}
                          onChange={(e) => setNewItem({...newItem, [`phpsi_${num}`]: e.target.value})}
                          placeholder={`파라미터 ${num}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      취소
                    </Button>
                    <Button onClick={handleAddItem} disabled={!newItem.item || createMutation.isPending}>
                      {createMutation.isPending ? '추가 중...' : '추가'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto border rounded-lg bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      style={{ width: column.width }}
                      className="font-semibold text-xs text-gray-700 border-r last:border-r-0"
                    >
                      {column.label}
                    </TableHead>
                  ))}
                  <TableHead className="w-16 text-center">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guideData.map((item, index) => (
                  <TableRow 
                    key={item.id} 
                    className={`group hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={`${item.id}-${column.key}`}
                        className="p-0 border-r last:border-r-0 align-top"
                        style={{ width: column.width }}
                      >
                        {renderCell(item, column)}
                      </TableCell>
                    ))}
                    <TableCell className="p-2 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRow(item.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="항목 삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>총 {guideData.length}개 항목</span>
              {pendingChanges.length > 0 && (
                <Badge variant="outline" className="text-amber-700 border-amber-300">
                  {pendingChanges.length}개 변경사항 대기 중
                </Badge>
              )}
            </div>
            <div className="text-xs text-gray-500">
              💡 셀 클릭 → 수정 → Enter 또는 바깥 클릭 → "업데이트" 버튼으로 일괄 저장
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseEdit;