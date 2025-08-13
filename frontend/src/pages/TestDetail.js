import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './TestDetail.css';
import personalityService from '../services/personalityService';

function TestDetail() {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [testResult, setTestResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTestDetail = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`http://localhost:8000/api/test-results/${testId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Test detayı alınamadı');
            }

            const data = await response.json();
            setTestResult(data);
        } catch (error) {
            console.error('Test detayı alınırken hata:', error);
            setError('Test detayı alınırken bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    }, [testId]);

    useEffect(() => {
        fetchTestDetail();
        // Sayfa başına dön
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [fetchTestDetail]);

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

    if (loading) {
        return <div className="loading">Yükleniyor...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!testResult) {
        return <div className="error-message">Test sonucu bulunamadı</div>;
    }

    return (
        <div className="test-detail-container">
            <div className="test-detail-header">
                <h1>{getTestTypeName(testResult.test_type)}</h1>
                <p className="test-date">
                    Tarih: {formatDate(testResult.created_at)}
                </p>
            </div>

            <div className="test-detail-content">
                {/* Özet gösterim */}
                {testResult.test_type === 'learningStyle' && (
                    <div className="learning-style-results">
                        <h2>Öğrenme Stili Analizi</h2>
                        <div className="learning-style-scores">
                            <div className="score-item">
                                <div className="score-label">
                                    <span>Görsel Öğrenme</span>
                                    <span>{testResult.results?.scores?.visual || 0}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill"
                                        style={{ width: `${testResult.results?.scores?.visual || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="score-item">
                                <div className="score-label">
                                    <span>İşitsel Öğrenme</span>
                                    <span>{testResult.results?.scores?.auditory || 0}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill"
                                        style={{ width: `${testResult.results?.scores?.auditory || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="score-item">
                                <div className="score-label">
                                    <span>Kinestetik Öğrenme</span>
                                    <span>{testResult.results?.scores?.kinesthetic || 0}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill"
                                        style={{ width: `${testResult.results?.scores?.kinesthetic || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="score-item">
                                <div className="score-label">
                                    <span>Okuma/Yazma</span>
                                    <span>{testResult.results?.scores?.reading || 0}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill"
                                        style={{ width: `${testResult.results?.scores?.reading || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                        <div className="learning-style-summary">
                            <h3>Baskın Öğrenme Stiliniz</h3>
                            <p className="dominant-style">
                                {testResult.results?.dominantStyle === 'visual' && 'Görsel Öğrenme'}
                                {testResult.results?.dominantStyle === 'auditory' && 'İşitsel Öğrenme'}
                                {testResult.results?.dominantStyle === 'kinesthetic' && 'Kinestetik Öğrenme'}
                                {testResult.results?.dominantStyle === 'reading' && 'Okuma/Yazma Öğrenme'}
                            </p>
                        </div>
                    </div>
                )}

                {testResult.test_type === 'personality' && (
                    <div className="learning-style-results">
                        <h2>Kişilik Analizi</h2>
                        <div className="learning-style-scores">
                            <div className="score-item">
                                <div className="score-label">
                                    <span>Dışadönüklük</span>
                                    <span>{testResult.results?.scores?.extroversion || 0}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill"
                                        style={{ width: `${testResult.results?.scores?.extroversion || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="score-item">
                                <div className="score-label">
                                    <span>Uyumluluk</span>
                                    <span>{testResult.results?.scores?.agreeableness || 0}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill"
                                        style={{ width: `${testResult.results?.scores?.agreeableness || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="score-item">
                                <div className="score-label">
                                    <span>Öz Disiplin</span>
                                    <span>{testResult.results?.scores?.conscientiousness || 0}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill"
                                        style={{ width: `${testResult.results?.scores?.conscientiousness || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="score-item">
                                <div className="score-label">
                                    <span>Duygusal İstikrar</span>
                                    <span>{testResult.results?.scores?.emotional || 0}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill"
                                        style={{ width: `${testResult.results?.scores?.emotional || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                        <div className="learning-style-summary">
                            <h3>Baskın Kişilik Özelliğiniz</h3>
                            <p className="dominant-style">
                                {(() => {
                                    const scores = testResult.results?.scores || {};
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

                {/* Detaylı analiz */}
                <div className="detail-analysis">
                    <h2>Detaylı Analiz</h2>
                    <div dangerouslySetInnerHTML={{ 
                        __html: personalityService.formatAIOutput(
                            typeof testResult.results.analysis === 'string' ? testResult.results.analysis :
                            typeof testResult.results.content === 'string' ? testResult.results.content :
                            typeof testResult.results === 'string' ? testResult.results :
                            JSON.stringify(testResult.results)
                        ) 
                    }} />
                </div>
            </div>

            <div className="test-detail-footer">
                <button 
                    className="back-button"
                    onClick={() => navigate('/results')}
                >
                    Sonuçlarıma Dön
                </button>
            </div>
        </div>
    );
}

export default TestDetail;
