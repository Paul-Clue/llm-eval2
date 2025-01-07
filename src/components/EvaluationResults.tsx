import { EvaluationResponse } from '@/types/ui';
import { useUIState } from '../hooks/useUIState';
// import { useApi } from '@/hooks/UseApi';

export function EvaluationResults({ evaluationResults }: { evaluationResults: EvaluationResponse[] }) {
  const tableHeadClasses = 'w-[80px] px-1 py-1 text-xs';

  const {
    selectedCell,
    setSelectedCell,
  } = useUIState();

  // const {
  //   // isLoading,
  //   // setIsLoading,
  //   evaluationResults,
  //   // setEvaluationResults,
  //   // handleSubmit: submitApi,
  //   // streamingContent,
  // } = useApi();
  return (
    <>
      {evaluationResults.length > 0 && (
        <div className='w-full max-w-7xl overflow-x-auto mt-8'>
          <table className='min-w-fit bg-white rounded-lg text-black text-xs'>
            <thead className='bg-gray-100'>
              <tr>
                <th className={tableHeadClasses}>Model Name</th>
                <th className={tableHeadClasses}>Model Type</th>
                <th className={tableHeadClasses}>Model Provider</th>
                <th className={tableHeadClasses}>Model Response</th>
                <th className={tableHeadClasses}>Relevance Score</th>
                <th className={tableHeadClasses}>Accuracy Score</th>
                <th className={tableHeadClasses}>Clarity Score</th>
                <th className={tableHeadClasses}>Coherence Score</th>
                <th className={tableHeadClasses}>Creativity Score</th>
                <th className={tableHeadClasses}>Alignment Score</th>
                <th className={tableHeadClasses}>Evaluation Score</th>
                <th className={tableHeadClasses}>Evaluation</th>
                <th className={tableHeadClasses}>Evaluation Feedback</th>
                <th className={tableHeadClasses}>Hallucination Score</th>
                <th className={tableHeadClasses}>Hallucination Feedback</th>
                <th className={tableHeadClasses}>Test Type</th>
              </tr>
            </thead>
            <tbody>
              {evaluationResults.map(
                (metric: EvaluationResponse, index: number) => (
                  <tr key={index}>
                    {[
                      'modelName',
                      'modelType',
                      'modelProvider',
                      'modelResponse',
                      'relevanceScore',
                      'accuracyScore',
                      'clarityScore',
                      'coherenceScore',
                      'creativityScore',
                      'alignmentScore',
                      'evaluationScore',
                      'evaluation',
                      'evaluationFeedback',
                      'hallucinationScore',
                      'hallucinationFeedback',
                      'testType',
                    ].map((key) => (
                      <td
                        key={key}
                        className='border px-4 py-2 max-w-[50px] truncate relative cursor-pointer hover:bg-blue-100 transition-all duration-200'
                        onClick={() =>
                          setSelectedCell(
                            selectedCell === `metric-${index}-${key}`
                              ? null
                              : `metric-${index}-${key}`
                          )
                        }
                      >
                        <span className='truncate block'>
                          {typeof metric[key as keyof EvaluationResponse] ===
                          'number'
                            ? (
                                metric[
                                  key as keyof EvaluationResponse
                                ] as number
                              ).toFixed(2)
                            : metric[key as keyof EvaluationResponse]}
                        </span>

                        {selectedCell === `metric-${index}-${key}` && (
                          <div
                            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 h-full w-full'
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className='bg-white text-black p-6 rounded-lg shadow-lg max-w-[800px] max-h-[80vh] overflow-y-auto m-4'>
                              <div className='flex justify-between items-start mb-4'>
                                <h3 className='font-bold text-lg'>
                                  {key
                                    .replace(/([A-Z])/g, ' $1')
                                    .replace(/^./, (str) => str.toUpperCase())}
                                </h3>
                                <button
                                  onClick={() => setSelectedCell(null)}
                                  className='text-gray-500 hover:text-gray-700'
                                >
                                  ✕
                                </button>
                              </div>
                              <div className='whitespace-pre-wrap'>
                                {typeof metric[
                                  key as keyof EvaluationResponse
                                ] === 'number'
                                  ? (
                                      metric[
                                        key as keyof EvaluationResponse
                                      ] as number
                                    ).toFixed(2)
                                  : metric[key as keyof EvaluationResponse]}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
