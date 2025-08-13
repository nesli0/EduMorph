import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Results.css';
import personalityService from '../services/personalityService';

function Results() {
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {
        fetchResults();
        // Sayfa başına dön
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const fetchResults = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('http://localhost:8000/api/test-results', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Test sonuçları alınamadı');
            }

            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error('Test sonuçları alınırken hata:', error);
            setError('Test sonuçları alınırken bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    const getTestTypeName = (type) => {
        const types = {
            'learningStyle': 'Öğrenme Stili Testi',
            'personality': 'Kişilik Testi',
            'career': 'Kariyer Testi'
        };
        return types[type] || type;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };



    const deleteResult = async (resultId) => {
        if (!window.confirm('Bu test sonucunu silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/api/test-results/${resultId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Test sonucu silinemedi');
            }

            // Sonucu listeden kaldır
            setResults(results.filter(result => result.id !== resultId));
        } catch (error) {
            console.error('Test sonucu silinirken hata:', error);
            alert('Test sonucu silinirken bir hata oluştu.');
        }
    };

    if (loading) {
        return <div className="loading">Yükleniyor...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="results-container">
            <h1>Test Sonuçlarım</h1>
            
            {results.length === 0 ? (
                <div className="no-results">
                    <p>Henüz test sonucunuz bulunmamaktadır.</p>
                    <button 
                        className="start-test-button"
                        onClick={() => navigate('/dashboard')}
                    >
                        Teste Başla
                    </button>
                </div>
            ) : (
                <div className="results-grid">
                    {results.map((result) => (
                        <div key={result.id} className="result-card">
                            <div className="result-header">
                                <div className="result-info" onClick={() => navigate(`/test-detail/${result.id}`)}>
                                    <h3>{getTestTypeName(result.test_type)}</h3>
                                    <p className="test-date">
                                        Tarih: {formatDate(result.created_at)}
                                    </p>
                                </div>
                            </div>
                            <div className="result-content">
                                {/* Özet gösterim - her zaman görünür */}
                                {result.test_type === 'learningStyle' && (
                                    <div className="learning-style-results">
                                        <h4>Öğrenme Stili Analizi</h4>
                                        <div className="learning-style-scores">
                                            <div className="score-item">
                                                <div className="score-label">
                                                    <span>Görsel Öğrenme</span>
                                                    <span>{result.results?.scores?.visual || 0}%</span>
                                                </div>
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ width: `${result.results?.scores?.visual || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="score-item">
                                                <div className="score-label">
                                                    <span>İşitsel Öğrenme</span>
                                                    <span>{result.results?.scores?.auditory || 0}%</span>
                                                </div>
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ width: `${result.results?.scores?.auditory || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="score-item">
                                                <div className="score-label">
                                                    <span>Kinestetik Öğrenme</span>
                                                    <span>{result.results?.scores?.kinesthetic || 0}%</span>
                                                </div>
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ width: `${result.results?.scores?.kinesthetic || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="score-item">
                                                <div className="score-label">
                                                    <span>Okuma/Yazma</span>
                                                    <span>{result.results?.scores?.reading || 0}%</span>
                                                </div>
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ width: `${result.results?.scores?.reading || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="learning-style-summary">
                                            <h5>Baskın Öğrenme Stiliniz</h5>
                                            <p className="dominant-style">
                                                {result.results?.dominantStyle === 'visual' && 'Görsel Öğrenme'}
                                                {result.results?.dominantStyle === 'auditory' && 'İşitsel Öğrenme'}
                                                {result.results?.dominantStyle === 'kinesthetic' && 'Kinestetik Öğrenme'}
                                                {result.results?.dominantStyle === 'reading' && 'Okuma/Yazma Öğrenme'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {result.test_type === 'personality' && (
                                    <div className="learning-style-results">
                                        <h4>Kişilik Analizi</h4>
                                        <div className="learning-style-scores">
                                            <div className="score-item">
                                                <div className="score-label">
                                                    <span>Dışadönüklük</span>
                                                    <span>{result.results?.scores?.extroversion || 0}%</span>
                                                </div>
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ width: `${result.results?.scores?.extroversion || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="score-item">
                                                <div className="score-label">
                                                    <span>Uyumluluk</span>
                                                    <span>{result.results?.scores?.agreeableness || 0}%</span>
                                                </div>
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ width: `${result.results?.scores?.agreeableness || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="score-item">
                                                <div className="score-label">
                                                    <span>Öz Disiplin</span>
                                                    <span>{result.results?.scores?.conscientiousness || 0}%</span>
                                                </div>
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ width: `${result.results?.scores?.conscientiousness || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="score-item">
                                                <div className="score-label">
                                                    <span>Duygusal İstikrar</span>
                                                    <span>{result.results?.scores?.emotional || 0}%</span>
                                                </div>
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ width: `${result.results?.scores?.emotional || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="learning-style-summary">
                                            <h5>Baskın Kişilik Özelliğiniz</h5>
                                            <p className="dominant-style">
                                                {(() => {
                                                    const scores = result.results?.scores || {};
                                                    const maxScore = Math.max(
                                                        scores.extroversion || 0,
                                                        scores.agreeableness || 0,
                                                        scores.conscientiousness || 0,
                                                        scores.emotional || 0
                                                    );
                                                    
                                                    if (maxScore === (scores.extroversion || 0)) return 'Dışadönük Kişilik';
                                                    if (maxScore === (scores.agreeableness || 0)) return 'Uyumlu Kişilik';
                                                    if (maxScore === (scores.conscientiousness || 0)) return 'Disiplinli Kişilik';
                                                    if (maxScore === (scores.emotional || 0)) return 'Duygusal İstikrarlı';
                                                    return 'Dengeli Kişilik';
                                                })()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {result.test_type === 'career' && (
                                    <div className="career-results">
                                        <h4>Kariyer Analizi</h4>
                                        <div dangerouslySetInnerHTML={{ 
                                            __html: personalityService.formatAIOutput(
                                                typeof result.results.analysis === 'string' ? result.results.analysis :
                                                typeof result.results.content === 'string' ? result.results.content :
                                                typeof result.results === 'string' ? result.results :
                                                JSON.stringify(result.results)
                                            ) 
                                        }} />
                                    </div>
                                )}
                            </div>
                            <div className="result-footer">
                                <button 
                                    className="delete-button"
                                    onClick={() => deleteResult(result.id)}
                                    title="Test sonucunu sil"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Results; 