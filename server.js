require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 强校验指令：确保专家身份与输出格式
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
    if (pin !== '0000') return res.status(401).send('访问拒绝');

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash", 
            systemInstruction: SYSTEM_INSTRUCTION 
        });
        const result = await model.generateContent(query);
        res.json({ result: result.response.text() });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(process.env.PORT || 3000);