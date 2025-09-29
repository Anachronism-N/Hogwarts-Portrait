/**
 * 对话API处理模块
 * 负责发送消息到API、接收响应、解析返回值并显示在对话框中
 */

// API配置
const API_CONFIG = {
    baseUrl: 'http://43.133.4.161/v1',
    apiKey: 'app-3NGED9jOPzOBIhwrAM40sRlv',
    endpoint: '/chat-messages'
};

// 对话状态管理
const chatState = {
    conversationId: null,
    isKenResponse: true,
    maxMessageLength: 200, // 默认最大消息长度
    maxLines: 3, // 默认最大行数
    fontSizeAdjustment: 0.9, // 字体大小调整因子
    // 翻页相关状态
    currentPage: { ken: 1, barbie: 1 },
    totalPages: { ken: 1, barbie: 1 },
    pageSize: 3, // 每页显示的行数
    messageCache: { ken: '', barbie: '' } // 缓存完整消息用于翻页
};

/**
 * 初始化聊天功能
 */
function initChat() {
    // 获取DOM元素
    const sendButton = document.getElementById('send-button');
    const userMessageInput = document.getElementById('user-message-input');
    const testButton = document.getElementById('test-button');
    
    // 添加事件监听器
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }
    
    if (userMessageInput) {
        userMessageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // // 添加测试按钮事件监听器
    // if (testButton) {
    //     testButton.addEventListener('click', function() {
    //         console.log('用户点击了测试按钮，开始测试JS返回字段处理');
    //         testResponseHandling();
    //     });
    // }
    
    // // 初始化显示默认消息
    // const defaultMessages = {
    //     ken: '     I love that energy, Barbie\'s enco!',
    //     barbie: '     我是Barbie，有什么我可以帮你的吗？'
    // };
    // showResponse(defaultMessages);
}

/**
 * 发送消息到API
 */
function sendMessage() {
    const userMessageInput = document.getElementById('user-message-input');
    const message = userMessageInput.value.trim();
    
    if (!message) {
        alert('请输入问题内容');
        return;
    }
    
    // 清空输入框
    userMessageInput.value = '';
    
    // 显示发送中的状态
    showLoadingState();
    
    // 构建完整的API URL
    const apiUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoint}`;
    
    // 调用API发送消息
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.apiKey}`
        },
        body: JSON.stringify({
            query: message,
            inputs: {},
            response_mode: 'blocking',
            user: 'barbie_chat_user',
            conversation_id: chatState.conversationId,
            auto_generate_name: true
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('API调用失败');
        }
        return response.json();
    })
    .then(data => {
        // 记录接收到的API原始响应
        console.log('接收到的API原始响应:', data);
        // 打印API返回值到控制台
        console.log('API返回值:', data);
        
        // 解析API响应
        const parsedResponse = parseApiResponse(data);
        
        // 记录解析后的响应
        console.log('解析后的响应:', parsedResponse);
        
        // 更新会话ID
        if (data.conversation_id) {
            chatState.conversationId = data.conversation_id;
            console.log('更新的会话ID:', chatState.conversationId);
        }
        
        // 确保parsedResponse是有效对象
        if (!parsedResponse || typeof parsedResponse !== 'object') {
            console.error('解析后的响应无效，使用默认值');
            parsedResponse = {
                ken: '     我是Ken，很高兴和你聊天！',
                barbie: '     我是Barbie，有什么我可以帮你的吗？'
            };
        }
        
        // 显示处理后的响应
        showResponse(parsedResponse);
    })
    .catch(error => {
        console.error('API调用错误:', error);
        // 在对话框中显示错误信息，确保传入的是对象而不是字符串
        showResponse({
            ken: '     抱歉，暂时无法获取回复，请稍后再试。',
            barbie: '     抱歉，暂时无法获取回复，请稍后再试。'
        });
    })
    .finally(() => {
        // 隐藏加载状态
        hideLoadingState();
    });
}

/**
 * 解析API响应
 * @param {Object} data - API返回的数据
 * @returns {Object} 包含Ken和Barbie响应的对象
 */
function parseApiResponse(data) {
    // 记录接收到的原始数据结构
    console.log('parseApiResponse接收到的数据:', data);
    
    // 检查数据结构并提取响应文本
    if (!data || typeof data !== 'object') {
        console.error('API响应无效，不是有效对象');
        return {
            ken: '     无法解析API响应',
            barbie: '     无法解析API响应'
        };
    }
    
    // 从不同可能的字段中获取响应文本
    let responseText = '';
    if (data.answer) {
        responseText = data.answer;
        console.log('从answer字段获取响应文本:', responseText);
    } else if (data.message) {
        responseText = data.message;
        console.log('从message字段获取响应文本:', responseText);
    } else if (data.text) {
        responseText = data.text;
        console.log('从text字段获取响应文本:', responseText);
    } else if (data.response) {
        responseText = data.response;
        console.log('从response字段获取响应文本:', responseText);
    } else if (data.output) {
        // 添加对output字段的支持
        responseText = data.output;
        console.log('从output字段获取响应文本:', responseText);
    } else if (data.result) {
        // 添加对result字段的支持
        responseText = data.result;
        console.log('从result字段获取响应文本:', responseText);
    } else {
        // 尝试获取嵌套的消息内容
        console.log('尝试获取嵌套的消息内容');
        const nestedMessage = data.chat_messages && data.chat_messages[0] && data.chat_messages[0].content;
        if (nestedMessage) {
            responseText = nestedMessage;
            console.log('从嵌套chat_messages获取响应文本:', responseText);
        } else if (data.content) {
            responseText = data.content;
            console.log('从content字段获取响应文本:', responseText);
        } else {
            responseText = 'API返回了无法识别的响应格式';
            console.warn('API返回了无法识别的响应格式，数据结构:', data);
        }
    }
    
    // 解析包含"barbie says:"和"ken says:"的文本
    const responses = {
        ken: '',
        barbie: ''
    };
    
    // 确保responseText是字符串
    responseText = String(responseText);
    console.log('最终要解析的响应文本:', responseText);
    
    // 使用更健壮的正则表达式提取Ken和Barbie的台词
    // 第一种格式: "ken says: ... barbie says: ..."
    let kenMatch = responseText.match(/ken\s+says:(.+?)(?=barbie\s+says:|$)/is);
    let barbieMatch = responseText.match(/barbie\s+says:(.+?)(?=ken\s+says:|$)/is);
    
    // 如果第一种格式没匹配到，尝试第二种格式: "Ken: ... Barbie: ..."
    if (!kenMatch) {
        kenMatch = responseText.match(/ken\s*:\s*(.+?)(?=barbie\s*:|$)/is);
        console.log('尝试第二种格式匹配Ken的台词:', kenMatch ? '匹配成功' : '匹配失败');
    } else {
        console.log('第一种格式匹配Ken的台词成功');
    }
    
    if (!barbieMatch) {
        barbieMatch = responseText.match(/barbie\s*:\s*(.+?)(?=ken\s*:|$)/is);
        console.log('尝试第二种格式匹配Barbie的台词:', barbieMatch ? '匹配成功' : '匹配失败');
    } else {
        console.log('第一种格式匹配Barbie的台词成功');
    }
    
    // 如果都没匹配到，尝试直接提取可能的对话内容
    if (!kenMatch && !barbieMatch) {
        console.log('未匹配到明确的对话标记，尝试分割文本');
        // 假设文本可能包含两人的对话，但没有明确的标记
        // 这里做一个简单的分割尝试
        const parts = responseText.split(/\n{2,}|\.\s*\n|\?\s*\n|!\s*\n/);
        
        if (parts.length >= 2) {
            console.log('文本分割成功，使用前两部分作为对话内容');
            responses.ken = '     ' + parts[0].trim();
            responses.barbie = '     ' + parts[1].trim();
        } else {
            // 如果无法分割，使用默认消息
            console.log('文本无法分割，使用默认消息');
            responses.ken = '     我是Ken，很高兴和你聊天！';
            responses.barbie = '     我是Barbie，有什么我可以帮你的吗？';
        }
    } else {
        // 提取Ken的台词并在前面添加五个空格
        responses.ken = kenMatch && kenMatch[1] ? '          ' + kenMatch[1].trim() : '          我是Ken，很高兴和你聊天！';
        
        // 提取Barbie的台词并在前面添加五个空格
        responses.barbie = barbieMatch && barbieMatch[1] ? '         ' + barbieMatch[1].trim() : '          我是Barbie，有什么我可以帮你的吗？';
        
        console.log('解析后的对话内容:', responses);
    }
    
    return responses;
}

/**
 * 显示加载状态
 */
function showLoadingState() {
    // 获取当前要显示消息的对话框
    const currentChatBox = chatState.isKenResponse ? 
        document.getElementById('ken-chat') : 
        document.getElementById('barbie-chat');
    
    // 清空现有内容
    clearChatBox(currentChatBox);
    
    // 添加加载中消息
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'absolute top-[30%] left-[25%] text-white text-[clamp(0.8rem,1.5vw,1rem)] font-bold text-shadow';
    loadingMessage.textContent = 'thinking';
    currentChatBox.appendChild(loadingMessage);
}

/**
 * 隐藏加载状态（实际在显示响应时会自动替换）
 */
function hideLoadingState() {
    // 加载状态会在显示响应时自动清除
}

/**
 * 在对话框中显示响应
 * @param {Object} messages - 包含Ken和Barbie响应的对象
 */
function showResponse(messages) {
    // 记录接收到的消息对象
    console.log('showResponse函数接收到的消息:', messages);
    
    // 确保messages是对象类型
    if (!messages || typeof messages !== 'object') {
        console.error('传入的messages不是有效对象，使用默认值');
        messages = {
            ken: '无法显示回复',
            barbie: '无法显示回复'
        };
    }
    
    // 获取Ken和Barbie的对话框
    const kenChatBox = document.getElementById('ken-chat');
    const barbieChatBox = document.getElementById('barbie-chat');
    
    // 检查对话框元素是否存在
    if (!kenChatBox || !barbieChatBox) {
        console.error('对话框元素未找到');
        return;
    }
    
    // 检查messages对象中的ken和barbie字段是否存在
    if (!messages.hasOwnProperty('ken')) {
        console.warn('messages对象中缺少ken字段，使用默认值');
        messages.ken = '     我是Ken，很高兴和你聊天！';
    }
    
    if (!messages.hasOwnProperty('barbie')) {
        console.warn('messages对象中缺少barbie字段，使用默认值');
        messages.barbie = '     我是Barbie，有什么我可以帮你的吗？';
    }
    
    // 清空现有内容
    clearChatBox(kenChatBox);
    clearChatBox(barbieChatBox);
    
    // 处理Ken的消息 - 移除'Ken: '前缀
    const processedKenMessage = processMessageForDisplay(messages.ken, kenChatBox);
    
    // 创建Ken的响应消息元素
    const kenResponseElement = document.createElement('div');
    kenResponseElement.className = 'absolute font-bold text-shadow whitespace-pre-wrap';    
    kenResponseElement.style.fontFamily = 'PixelifySans, sans-serif';
    kenResponseElement.style.fontSize = '16px'; // 确保设置了默认字体大小
    kenResponseElement.textContent = processedKenMessage;
    // 在显示Ken的文本前先打印到控制台
    console.log('Ken的消息:', processedKenMessage);
    kenChatBox.appendChild(kenResponseElement);
    positionTextInChatBox(kenResponseElement, kenChatBox);
    
    // 处理Barbie的消息 - 移除'Barbie: '前缀
    const processedBarbieMessage = processMessageForDisplay(messages.barbie, barbieChatBox);
    
    // 创建Barbie的响应消息元素
    const barbieResponseElement = document.createElement('div');
    barbieResponseElement.className = 'absolute font-bold text-shadow whitespace-pre-wrap';   
    barbieResponseElement.style.fontFamily = 'PixelifySans, sans-serif';
    barbieResponseElement.style.fontSize = '16px'; // 确保设置了默认字体大小
    barbieResponseElement.textContent = processedBarbieMessage;
    // 在显示Barbie的文本前先打印到控制台
    console.log('Barbie的消息:', processedBarbieMessage);
    barbieChatBox.appendChild(barbieResponseElement);
    positionTextInChatBox(barbieResponseElement, barbieChatBox);
    
    // 添加翻页控制按钮（如果需要）
    addPaginationControls('ken', kenChatBox);
    addPaginationControls('barbie', barbieChatBox);
    
    // 记录消息显示完成
    console.log('消息显示完成:', {
        ken: processedKenMessage,
        barbie: processedBarbieMessage
    });
}

/**
 * 处理消息以确保适合在对话框中显示
 * @param {string} message - 原始消息
 * @param {HTMLElement} chatBox - 对话框元素
 * @returns {string} 处理后的消息
 */
function processMessageForDisplay(message, chatBox) {
    // 1. 保存完整消息到缓存中
    const character = chatBox.id === 'ken-chat' ? 'ken' : 'barbie';
    chatState.messageCache[character] = message;
    
    // 2. 计算总页数
    const allLines = message.split('\n');
    chatState.totalPages[character] = Math.max(1, Math.ceil(allLines.length / chatState.pageSize));
    chatState.currentPage[character] = 1; // 重置到第一页
    
    // 3. 获取当前页的消息
    const startIndex = (chatState.currentPage[character] - 1) * chatState.pageSize;
    const endIndex = Math.min(startIndex + chatState.pageSize, allLines.length);
    let currentPageMessage = allLines.slice(startIndex, endIndex).join('\n');

    // 4. 计算适当的字体大小
    const fontSize = calculateAppropriateFontSize(currentPageMessage, chatBox);

    // 5. 如果仍然超出范围，进一步截断消息
    currentPageMessage = truncateMessageToFit(currentPageMessage, chatBox, fontSize);

    return currentPageMessage;
}

/**
 * 截断过长的消息
 * @param {string} message - 原始消息
 * @returns {string} 处理后的消息（保留完整内容，由翻页功能处理分页）
 */
function truncateMessage(message) {
    // 由于我们现在使用翻页功能，不再截断消息
    // 只做简单的处理，去除多余的空格和换行
    return message.trim();
}

/**
 * 计算适当的字体大小以确保文本适合对话框
 * @param {string} message - 要显示的消息
 * @param {HTMLElement} chatBox - 对话框元素
 * @returns {number} 建议的字体大小（像素）
 */
function calculateAppropriateFontSize(message, chatBox) {
    // 获取对话框的尺寸
    const chatBoxRect = chatBox.getBoundingClientRect();
    
    // 估算合适的字体大小（基于对话框宽度和消息长度）
    // 这是一个简单的估算方法，实际应用中可能需要更复杂的计算
    let baseFontSize = 16; // 基础字体大小
    
    // 根据消息长度调整字体大小
    if (message.length > 100) {
        baseFontSize *= 0.8;
    } else if (message.length > 50) {
        baseFontSize *= 0.9;
    }
    
    // 应用字体大小调整因子
    baseFontSize *= chatState.fontSizeAdjustment;
    
    return baseFontSize;
}

/**
 * 截断消息以确保适合对话框
 * @param {string} message - 原始消息
 * @param {HTMLElement} chatBox - 对话框元素
 * @param {number} fontSize - 字体大小
 * @returns {string} 适合对话框的消息
 */
function truncateMessageToFit(message, chatBox, fontSize) {
    // 这里可以实现更复杂的文本测量和截断逻辑
    // 为简化起见，我们根据行数截断
    const lines = message.split('\n');
    
    if (lines.length > chatState.maxLines) {
        // 截断到最大行数
        const truncatedLines = lines.slice(0, chatState.maxLines);
        return truncatedLines.join('\n') + '...';
    }
    
    return message;
}

/**
 * 添加翻页控制按钮
 * @param {string} character - 角色名称 ('ken' 或 'barbie')
 * @param {HTMLElement} chatBox - 对话框元素
 */
function addPaginationControls(character, chatBox) {
    // 检查是否需要翻页控制
    if (chatState.totalPages[character] <= 1) {
        // 移除已有的翻页控制
        removePaginationControls(chatBox);
        return;
    }
    
    // 移除已有的翻页控制
    removePaginationControls(chatBox);
    
    // 创建翻页控制容器
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'absolute bottom-[5%] left-0 right-0 flex justify-center items-center gap-2 z-10';
    paginationContainer.dataset.pagination = character;
    
    // 创建上一页按钮
    const prevButton = document.createElement('button');
    prevButton.className = 'bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs hover:bg-opacity-70 transition-all';
    prevButton.textContent = '上一页';
    prevButton.disabled = chatState.currentPage[character] <= 1;
    prevButton.addEventListener('click', () => handlePageChange(character, -1, chatBox));
    
    // 创建页码显示
    const pageIndicator = document.createElement('span');
    pageIndicator.className = 'bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs';
    pageIndicator.textContent = `${chatState.currentPage[character]}/${chatState.totalPages[character]}`;
    
    // 创建下一页按钮
    const nextButton = document.createElement('button');
    nextButton.className = 'bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs hover:bg-opacity-70 transition-all';
    nextButton.textContent = '下一页';
    nextButton.disabled = chatState.currentPage[character] >= chatState.totalPages[character];
    nextButton.addEventListener('click', () => handlePageChange(character, 1, chatBox));
    
    // 添加到容器
    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(pageIndicator);
    paginationContainer.appendChild(nextButton);
    
    // 添加到对话框
    chatBox.appendChild(paginationContainer);
}

/**
 * 移除翻页控制按钮
 * @param {HTMLElement} chatBox - 对话框元素
 */
function removePaginationControls(chatBox) {
    const existingControls = chatBox.querySelector('[data-pagination]');
    if (existingControls) {
        chatBox.removeChild(existingControls);
    }
}

/**
 * 处理翻页请求
 * @param {string} character - 角色名称 ('ken' 或 'barbie')
 * @param {number} pageDelta - 页码变化量 (+1 或 -1)
 * @param {HTMLElement} chatBox - 对话框元素
 */
function handlePageChange(character, pageDelta, chatBox) {
    // 计算新页码
    const newPage = chatState.currentPage[character] + pageDelta;
    
    // 确保新页码在有效范围内
    if (newPage < 1 || newPage > chatState.totalPages[character]) {
        return;
    }
    
    // 更新当前页码
    chatState.currentPage[character] = newPage;
    
    // 获取完整消息
    const fullMessage = chatState.messageCache[character];
    
    // 分割成行
    const allLines = fullMessage.split('\n');
    
    // 获取当前页的消息
    const startIndex = (newPage - 1) * chatState.pageSize;
    const endIndex = Math.min(startIndex + chatState.pageSize, allLines.length);
    let currentPageMessage = allLines.slice(startIndex, endIndex).join('\n');
    
    // 计算适当的字体大小
    const fontSize = calculateAppropriateFontSize(currentPageMessage, chatBox);
    
    // 确保消息适合对话框
    currentPageMessage = truncateMessageToFit(currentPageMessage, chatBox, fontSize);
    
    // 获取文本元素
    const textElement = chatBox.querySelector('.chat-text');
    if (textElement) {
        // 更新文本内容
        textElement.textContent = currentPageMessage;
        textElement.style.fontSize = `${fontSize}px`;
        
        // 重新定位文本
        positionTextInChatBox(textElement, chatBox);
        
        // 更新翻页控制
        addPaginationControls(character, chatBox);
        
        // 打印到控制台
        console.log(`${character}的消息 - 第${newPage}页:`, currentPageMessage);
    }
}

/**
 * 在对话框中居中定位文本元素
 * @param {HTMLElement} textElement - 文本元素
 * @param {HTMLElement} chatBox - 对话框元素
 */
// This is the NEW, MODIFIED code
function positionTextInChatBox(textElement, chatBox) {
    // 强制设置字体
    textElement.style.fontFamily = 'PixelifySans, sans-serif'; // Or your custom font
    textElement.style.fontWeight = 'bold';
    // IMPORTANT: Change text color to black or a dark color for better visibility on a pink background
    textElement.style.color = 'black'; 
    
    // --- START OF MAJOR CHANGES ---

    // 1. Set the top-left starting position of the text block.
    //    This pushes the text down and to the right, away from the "Ken:" label.
    textElement.style.top = '25%'; // Pushes text down from the top edge
    textElement.style.left = '10%'; // Pushes text away from the left edge

    // 2. Remove the centering transform. This is the most important change.
    textElement.style.transform = 'none'; 
    
    // 3. Set the width and height of the text block to fit inside the bubble.
    textElement.style.maxWidth = '80%'; // Constrains width to 80% of the bubble image
    textElement.style.maxHeight = '65%';// Constrains height 
    textElement.style.overflow = 'hidden';

    // 4. Change text alignment from 'center' to 'left'.
    textElement.style.textAlign = 'left'; // Aligns text to the left

    // --- END OF MAJOR CHANGES ---

    // 添加文本阴影以提高可读性 (You may want to adjust or remove this for black text)
    textElement.style.textShadow = '1px 1px 2px rgba(255, 255, 255, 0.2)';
    
    // 调整字体大小以确保文本适合
    const fontSize = calculateAppropriateFontSize(textElement.textContent, chatBox);
    textElement.style.fontSize = `${fontSize}px`;
    
    // 确保文本换行正常
    textElement.style.whiteSpace = 'pre-warp';
    textElement.style.wordBreak = 'break-word';
}

/**
 * 清空对话框内容
 * @param {HTMLElement} chatBox - 要清空的对话框
 */
function clearChatBox(chatBox) {
    // 移除除了背景图片外的所有子元素
    const childNodes = Array.from(chatBox.children);
    childNodes.forEach(node => {
        if (node.tagName !== 'IMG') {
            chatBox.removeChild(node);
        }
    });
}

// 在DOM加载完成后初始化聊天功能
document.addEventListener('DOMContentLoaded', initChat);

/**
 * 测试函数：手动验证JS返回字段的处理
 * 可以通过浏览器控制台调用：ChatAPI.testResponseHandling()
 */
// function testResponseHandling() {
//     console.log('=== 开始测试JS返回字段处理 ===');
    
//     // 测试用例1：标准格式响应
//     const testResponse1 = {
//         answer: "ken says: I love that energy, Barbie's enco! barbie says: 我是Barbie，有什么我可以帮你的吗？"
//     };
    
//     console.log('测试用例1 - 标准格式:', testResponse1);
//     const parsed1 = parseApiResponse(testResponse1);
//     console.log('测试用例1 - 解析结果:', parsed1);
//     showResponse(parsed1);
    
//     // 测试用例2：替代格式响应
//     const testResponse2 = {
//         message: "Ken: Hello everyone! Barbie: Hi there, how can I help?"
//     };
    
//     setTimeout(() => {
//         console.log('测试用例2 - 替代格式:', testResponse2);
//         const parsed2 = parseApiResponse(testResponse2);
//         console.log('测试用例2 - 解析结果:', parsed2);
//         showResponse(parsed2);
        
//         // 测试用例3：没有明确标记的响应
//         const testResponse3 = {
//             text: "这是Ken的第一句话。\n\n这是Barbie的回应。"
//         };
        
//         setTimeout(() => {
//             console.log('测试用例3 - 无标记格式:', testResponse3);
//             const parsed3 = parseApiResponse(testResponse3);
//             console.log('测试用例3 - 解析结果:', parsed3);
//             showResponse(parsed3);
            
//             console.log('=== 测试完成 ===');
//         }, 2000);
//     }, 2000);
// }

// 导出函数以便在外部使用（如果需要）
window.ChatAPI = {
    sendMessage,
    initChat,
    chatState,
    // testResponseHandling
};