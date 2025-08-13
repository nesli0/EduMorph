const API_URL = 'http://localhost:8000';

const weights = {
    'extroversion': {
        'q1': {'A': 0.9, 'B': 0.5, 'C': 0.1},
        'q6': {'A': 0.9, 'B': 0.5, 'C': 0.1},
        'q10': {'A': 0.9, 'B': 0.5, 'C': 0.1}
    },
    'emotional': {
        'q2': {'A': 0.9, 'B': 0.5, 'C': 0.1},
        'q7': {'A': 0.9, 'B': 0.5, 'C': 0.1}
    },
    'conscientiousness': {
        'q3': {'A': 0.9, 'B': 0.5, 'C': 0.1},
        'q5': {'A': 0.9, 'B': 0.5, 'C': 0.1},
        'q8': {'A': 0.9, 'B': 0.5, 'C': 0.1}
    },
    'agreeableness': {
        'q4': {'A': 0.9, 'B': 0.5, 'C': 0.1},
        'q9': {'A': 0.9, 'B': 0.5, 'C': 0.1}
    }
};

const analyzePersonality = (answers) => {
    const scores = {};
    for (const trait in weights) {
        let traitScore = 0;
        let count = 0;
        for (const [question, answer] of Object.entries(answers)) {
            if (weights[trait][question]) {
                traitScore += weights[trait][question][answer];
                count++;
            }
        }
        scores[trait] = count > 0 ? (traitScore / count) * 100 : 0;
    }
    return scores;
};

export const generateAIAnalysis = async (prompt) => {
    try {
        console.log('AI analizi için istek gönderiliyor...');
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://localhost:8000/api/generate-content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ prompt: prompt })
        });

        if (!response.ok) {
            console.error('API yanıt hatası:', response.status, response.statusText);
            throw new Error(`API yanıt hatası: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API yanıtı:', data);

        if (!data.content) {
            console.error('API yanıtında içerik bulunamadı:', data);
            throw new Error('API yanıtında içerik bulunamadı');
        }

        return data.content;
    } catch (error) {
        console.error('AI analizi hatası:', error);
        throw error;
    }
};

export const formatAIOutput = (text) => {
    if (!text) return '';
    
    // JSON string ise, recommendations alanını çıkar ve formatla
    if (text.startsWith('{') && text.includes('"scores"')) {
        try {
            const parsed = JSON.parse(text);
            
            // Eğer recommendations varsa, sadece onu formatla
            if (parsed.recommendations) {
                let recommendations = parsed.recommendations;
                
                // \n karakterlerini gerçek satır sonlarına çevir
                recommendations = recommendations.replace(/\\n/g, '\n');
                
                // Başlıkları düzenle
                recommendations = recommendations.replace(/(\d+\.\s+[^\n]+)/g, '<h3>$1</h3>');
                
                // Listeleri düzenle
                recommendations = recommendations.replace(/\n\s*•\s*([^\n]+)/g, '<li>$1</li>');
                recommendations = recommendations.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
                
                // Paragrafları düzenle
                recommendations = recommendations.split('\n\n').map(paragraph => {
                    paragraph = paragraph.trim();
                    if (!paragraph.startsWith('<h3>') && !paragraph.startsWith('<ul>') && paragraph.length > 0) {
                        return `<p>${paragraph}</p>`;
                    }
                    return paragraph;
                }).join('');
                
                return recommendations;
            }
            
            // Recommendations yoksa JSON'u göster
            return `<pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 12px; color: #666;">${JSON.stringify(parsed, null, 2)}</pre>`;
        } catch (e) {
            // JSON parse edilemezse normal text olarak işle
        }
    }
    
    // Normal text için HTML formatla
    let formattedText = text;
    
    // \n karakterlerini <br> ile değiştir
    formattedText = formattedText.replace(/\\n/g, '<br>');
    
    // Başlıkları düzenle
    formattedText = formattedText.replace(/### (.*?)\n/g, '<h3>$1</h3>');
    
    // Listeleri düzenle
    formattedText = formattedText.replace(/\n- (.*?)(?=\n|$)/g, '<li>$1</li>');
    formattedText = formattedText.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
    
    // Önemli notları vurgula
    formattedText = formattedText.replace(/Önemli: (.*?)(?=\n|$)/g, '<div class="ai-note">$1</div>');
    formattedText = formattedText.replace(/Uyarı: (.*?)(?=\n|$)/g, '<div class="ai-warning">$1</div>');
    formattedText = formattedText.replace(/Başarı: (.*?)(?=\n|$)/g, '<div class="ai-success">$1</div>');
    
    // Paragrafları düzenle
    formattedText = formattedText.split('\n\n').map(paragraph => {
        if (!paragraph.startsWith('<h3>') && !paragraph.startsWith('<ul>') && 
            !paragraph.startsWith('<div class="ai-note">') && 
            !paragraph.startsWith('<div class="ai-warning">') && 
            !paragraph.startsWith('<div class="ai-success">')) {
            return `<p>${paragraph}</p>`;
        }
        return paragraph;
    }).join('');

    return formattedText;
};

const saveTestResults = async (testType, results) => {
    try {
        const response = await fetch(`${API_URL}/api/save-test-results`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                testType,
                results
            })
        });

        if (!response.ok) {
            throw new Error('Test sonuçları kaydedilemedi');
        }

        return await response.json();
    } catch (error) {
        console.error('Test sonuçları kaydedilirken hata:', error);
        throw error;
    }
};

const personalityService = {
    analyzePersonality,
    generateAIAnalysis,
    formatAIOutput,
    saveTestResults
};

export default personalityService; 