import type { ChatMessage, TaskResult, FileResult, StatsResult } from '../dto/ChatbotTypes';

// ============================================
// N8N İNTEQRASİYA: Aşağıdakı mock funksiyaları
// N8N webhook URL ilə əvəz edin.
//
// Nümunə:
// const N8N_WEBHOOK_URL = "https://your-n8n.com/webhook/chatbot";
// async function sendMessage(text: string): Promise<ChatMessage> {
//   const response = await fetch(N8N_WEBHOOK_URL, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ message: text, userId: currentUserId })
//   });
//   return response.json();
// }
// ============================================

const MOCK_TASKS: TaskResult[] = [
    { id: 902, title: "Q rübü üçün maliyyə hesabatlarının analizi", description: "Enterprise səviyyəsində bütün departamentlərin xərclərinin hesablanması", status: "InProgress", difficulty: "Medium", deadline: "12 Oct 2023", assignedTo: "Ravan" },
    { id: 884, title: "Müştəri interfeysinin UI/UX yenilənməsi", description: "Dashboard ekranlarının yenidən dizaynı və prototipləşdirilməsi", status: "Overdue", difficulty: "Hard", deadline: "05 Oct 2023", assignedTo: "Vəli" },
    { id: 721, title: "API inteqrasiya testləri", description: "Ödəniş şlüzlərinin Sandbox mühitində yoxlanılması", status: "Completed", difficulty: "Easy", deadline: "01 Oct 2023", assignedTo: "Əli" },
    { id: 856, title: "Təhlükəsizlik audit hesabatı", description: "İllik penetration test nəticələrinin analizi və təqdim edilməsi", status: "Pending", difficulty: "Hard", deadline: "20 Oct 2023", assignedTo: "Ravan" },
    { id: 101, title: 'API İnteqrasiyasını Tamamla', description: 'Backend API-ləri frontend ilə birləşdir.', status: 'InProgress', difficulty: 'Hard', deadline: '2023-11-20' },
];

const MOCK_OVERDUE_TASKS: TaskResult[] = [
    { id: 884, title: "Müştəri interfeysinin UI/UX yenilənməsi", description: "Dashboard ekranlarının yenidən dizaynı və prototipləşdirilməsi", status: "Overdue", difficulty: "Hard", deadline: "05 Oct 2023", assignedTo: "Vəli" },
    { id: 201, title: 'Sənədləşməni Hazırla', description: 'Layihə sənədlərini tamamla.', status: 'Overdue', difficulty: 'Medium', deadline: '2023-11-10' },
    { id: 202, title: 'Müştəri Görüşü', description: 'Müştəri ilə tələbləri dəqiqləşdir.', status: 'Overdue', difficulty: 'Easy', deadline: '2023-11-12' },
];

const MOCK_FILES: FileResult[] = [
    { id: 1, fileName: 'Q3_Report.pdf', fileType: 'pdf', size: '2.4 MB', uploadDate: '2023-11-15', taskName: 'Hesabat Hazırlığı' },
    { id: 2, fileName: 'Dashboard_Mockup.png', fileType: 'image', size: '1.8 MB', uploadDate: '2023-11-14', taskName: 'Dizayn' },
    { id: 3, fileName: 'Budget_2024.xlsx', fileType: 'excel', size: '850 KB', uploadDate: '2023-11-13', taskName: 'Maliyyə Planı' },
    { id: 4, fileName: 'Meeting_Notes.txt', fileType: 'text', size: '12 KB', uploadDate: '2023-11-12', taskName: 'Həftəlik İclas' },
    { id: 5, fileName: "Q3_Forecast_Executive.pdf", fileType: "pdf", size: "2.4 MB", uploadDate: "10 Oct 2023", taskName: "Maliyyə analizi" },
];

export const sendMessage = async (text: string): Promise<ChatMessage> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const lowerText = text.toLowerCase();
            let responseMessage: ChatMessage = {
                id: Date.now().toString(),
                sender: 'ai',
                text: '',
                type: 'text',
                timestamp: new Date(),
            };

            if (lowerText.includes('aktiv') || lowerText.includes('tapşırıq') || lowerText.includes('task')) {
                responseMessage.text = 'Aşağıda hazırda aktiv olan tapşırıqlarınızın siyahısı verilmişdir:';
                responseMessage.type = 'tasks';
                responseMessage.data = MOCK_TASKS;
            } else if (lowerText.includes('gecik') || lowerText.includes('overdue') || lowerText.includes('vaxt')) {
                responseMessage.text = 'Diqqət! Aşağıdakı tapşırıqların vaxtı keçib:';
                responseMessage.type = 'tasks';
                responseMessage.data = MOCK_OVERDUE_TASKS;
            } else if (lowerText.includes('fayl') || lowerText.includes('file') || lowerText.includes('sənəd')) {
                responseMessage.text = 'Tapılan son fayllar bunlar oldu:';
                responseMessage.type = 'files';
                responseMessage.data = MOCK_FILES;
            } else if (lowerText.includes('statistika') || lowerText.includes('stat') || lowerText.includes('say')) {
                responseMessage.text = 'Ümumi aktiv tapşırıq statistikası aşağıdakı kimidir:';
                responseMessage.type = 'stats';
                responseMessage.data = { label: "Aktiv tapşırıqlar", value: 21, trend: +12.4 } as StatsResult;
            } else if (lowerText.includes('komanda') || lowerText.includes('team')) {
                responseMessage.text = 'Komandanızın cari iş yükü:';
                responseMessage.type = 'stats';
                responseMessage.data = { label: "Komanda iş yükü", value: 87, unit: "%", trend: +5 } as StatsResult;
            } else {
                responseMessage.text = 'Bağışlayın, bu sorğunu tam başa düşə bilmədim. Aşağıdakı sürətli düymələrdən istifadə edə bilərsiniz.';
                responseMessage.type = 'text'; // Default to text to show quick actions again in UI logic if needed
            }

            resolve(responseMessage);
        }, 1500); // 1.5s delay
    });
};
