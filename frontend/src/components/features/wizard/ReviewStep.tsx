import { useEffect } from 'react';
import { Check, AlertTriangle, AlertCircle, Info, Rocket, Loader2 } from 'lucide-react';
import type { WizardData } from '../../../pages/NewRun';
import type { DataQualityReport, QualityWarning } from '../../../types';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { useQualityCheck } from '../../../hooks/useConfigs';

interface ReviewStepProps {
  data: WizardData;
  onLaunch: () => void;
  onBack: () => void;
  isLoading: boolean;
}

function getScoreColor(score: number) {
  if (score >= 80) return 'bg-green-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function getScoreTextColor(score: number) {
  if (score >= 80) return 'text-green-700';
  if (score >= 50) return 'text-amber-700';
  return 'text-red-700';
}

function SeverityIcon({ severity }: { severity: QualityWarning['severity'] }) {
  if (severity === 'error') return <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />;
  if (severity === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />;
  return <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />;
}

function QualityReportView({ report }: { report: DataQualityReport }) {
  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="flex items-center gap-4">
        <div className="flex-1 bg-efx-gray-100 rounded-full h-3">
          <div
            className={`${getScoreColor(report.overall_score)} rounded-full h-3 transition-all`}
            style={{ width: `${report.overall_score}%` }}
          />
        </div>
        <span className={`text-lg font-semibold ${getScoreTextColor(report.overall_score)}`}>
          {report.overall_score}%
        </span>
      </div>
      <p className="text-xs text-efx-gray-500">
        Based on {report.sample_size} sample records — mapping completeness, null values, format validation, and duplicates.
      </p>

      {/* Mapping Completeness */}
      <div>
        <div className="text-sm font-medium text-efx-gray-900 mb-1">
          Mapping: {report.mapping_completeness.mapped_count}/{report.mapping_completeness.total_fields} fields
        </div>
        {report.mapping_completeness.unmapped_fields.length > 0 && (
          <div className="text-xs text-efx-gray-500">
            Unmapped: {report.mapping_completeness.unmapped_fields.join(', ')}
          </div>
        )}
      </div>

      {/* Field Stats Table */}
      <div className="overflow-hidden border border-efx-gray-200 rounded-lg">
        <table className="min-w-full text-xs">
          <thead className="bg-efx-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-efx-gray-600">Field</th>
              <th className="px-3 py-2 text-right font-medium text-efx-gray-600">Populated</th>
              <th className="px-3 py-2 text-right font-medium text-efx-gray-600">Null/Empty</th>
              <th className="px-3 py-2 text-right font-medium text-efx-gray-600">Format Errors</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-efx-gray-100">
            {report.field_stats.map((fs) => (
              <tr key={fs.field} className={!fs.mapped_to ? 'opacity-40' : ''}>
                <td className="px-3 py-1.5 text-efx-gray-900">
                  {fs.field}
                  {!fs.mapped_to && <span className="ml-1 text-efx-gray-400">(unmapped)</span>}
                </td>
                <td className="px-3 py-1.5 text-right text-efx-gray-700">
                  {fs.populated}/{fs.total}
                </td>
                <td className="px-3 py-1.5 text-right">
                  <span className={fs.null_percent > 20 ? 'text-amber-600 font-medium' : 'text-efx-gray-700'}>
                    {fs.null_or_empty} ({fs.null_percent}%)
                  </span>
                </td>
                <td className="px-3 py-1.5 text-right">
                  <span className={fs.format_errors > 0 ? 'text-amber-600 font-medium' : 'text-efx-gray-700'}>
                    {fs.format_errors}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Duplicates */}
      {report.duplicates.count > 0 && (
        <div className="text-sm">
          <span className="font-medium text-efx-gray-900">Duplicates: </span>
          <span className="text-amber-700">{report.duplicates.count} ({report.duplicates.percent}%)</span>
        </div>
      )}

      {/* Warnings */}
      {report.warnings.length > 0 && (
        <div className="space-y-1.5">
          {report.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <SeverityIcon severity={w.severity} />
              <span className="text-efx-gray-700">{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs font-medium text-blue-900 mb-1">Recommendations</div>
          <ul className="text-xs text-blue-800 space-y-1">
            {report.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ReviewStep({ data, onLaunch, onBack, isLoading }: ReviewStepProps) {
  const mappedFields = Object.entries(data.columnMapping).filter(([_, v]) => v);
  const totalFields = 6;

  const qualityCheck = useQualityCheck();

  useEffect(() => {
    qualityCheck.mutate({
      column_mapping: data.columnMapping,
      source_table: data.selectedTable || 'reference_businesses',
    });
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="p-6">
        <h3 className="text-base font-medium text-efx-gray-900 mb-4">Run Summary</h3>

        <div className="space-y-4">
          {/* Connection */}
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-efx-gray-900">Data Source</div>
              <div className="text-sm text-efx-gray-600">
                {data.connectionType === 'sqlite' ? 'SQLite Demo Database' : 'Snowflake'} — {data.selectedTable || 'reference_businesses'}
              </div>
            </div>
          </div>

          {/* Mapping */}
          <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-efx-gray-900">Column Mapping</div>
              <div className="text-sm text-efx-gray-600">
                {mappedFields.length} of {totalFields} fields mapped
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {mappedFields.map(([efx, source]) => (
                  <div key={efx} className="text-xs bg-efx-gray-50 rounded px-2 py-1">
                    <span className="text-efx-gray-600">{efx}</span>
                    <span className="text-efx-gray-400 mx-1">&rarr;</span>
                    <span className="font-mono text-efx-gray-900">{source}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Config */}
          {data.saveAsConfig && (
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-efx-gray-900">Save Configuration</div>
                <div className="text-sm text-efx-gray-600">
                  {data.configName || 'Unnamed Configuration'}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Data Quality */}
      <Card className="p-6">
        <h3 className="text-sm font-medium text-efx-gray-900 mb-3">Data Quality Check</h3>

        {qualityCheck.isPending && (
          <div className="flex items-center gap-3 py-6 justify-center text-efx-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Analyzing sample data...</span>
          </div>
        )}

        {qualityCheck.isError && (
          <div className="flex items-center gap-2 text-amber-700 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Failed to run quality checks. You can still launch.</span>
          </div>
        )}

        {qualityCheck.isSuccess && qualityCheck.data && (
          <QualityReportView report={qualityCheck.data} />
        )}
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button
          variant="primary"
          onClick={onLaunch}
          isLoading={isLoading}
          disabled={qualityCheck.isPending}
        >
          <Rocket className="h-4 w-4 mr-2" />
          Launch Matching Job
        </Button>
      </div>
    </div>
  );
}
