require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 确保 API Key 被读取
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyBpKrANJLM450pr5mERRbaEhIzIYhUKpnk";
const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_INSTRUCTION = `
你是“安全技术规范审计专家”。
1. 绝对准则：严谨溯源，零幻觉。所有结论必须源自文件上下文。
2. 强条识别：只要包含“必须、严禁、应”且为强条，必须标注为【规范要求（强条）】并红色高亮。
3. 输出模块化：
   - 模块 A：专业数据检索指引（矩阵式、关键词云、单位标准）。
   - 模块 B：标准化检查表格（序号|检查对象|检查项目|规范要求|依据|状态）。
   - 模块 C：合规性判定逻辑（标准差异/从严执行原则）。
   - 模块 D：信息盲区预警与适用边界核验（明确缺失参数、复核适用范围）。
`;

app.post('/api/audit', async (req, res) => {
    const { pin, query } = req.body;
    
    if (pin !== '0000') {
        return res.status(401).json({ error: '访问拒绝：PIN 码错误' });
    }

    if (!query) {
        return res.status(400).json({ error: '审计指令不能为空' });
    }

    try {
        // 使用明确的模型路径，防止 404 错误
        const model = genAI.getGenerativeModel({ 
            model: "models/gemini-1.5-flash", 
            systemInstruction: SYSTEM_INSTRUCTION 
        });
        
        const result = await model.generateContent(query);
        const responseText = result.response.text();
        
        res.json({ result: responseText });
    } catch (e) {
        console.error("审计执行错误:", e);
        // 如果再次报错 404，可能是该 API Key 的权限问题，前端会弹窗显示此错误
        res.status(500).json({ error: e.message || "服务器内部审计异常" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`EHS 审计系统运行中，端口: ${PORT}`);
});