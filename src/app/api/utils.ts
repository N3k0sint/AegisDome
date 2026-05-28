import { NextResponse } from 'next/server';

export function formatVtResponse(vtData: any) {
    const attributes = vtData.attributes;
    const stats = attributes.last_analysis_stats || attributes.stats;
    const vendors = attributes.last_analysis_results || attributes.results;
    const maliciousCount = stats?.malicious || 0;
    const totalCount = (stats?.malicious || 0) + (stats?.suspicious || 0) + (stats?.undetected || 0) + (stats?.harmless || 0);

    const details = {
      meaningful_name: attributes.meaningful_name || attributes.title || null,
      sha256: attributes.sha256 || null,
      md5: attributes.md5 || null,
      sha1: attributes.sha1 || null,
      size: attributes.size || null,
      ssdeep: attributes.ssdeep || null,
      tlsh: attributes.tlsh || null,
      type_description: attributes.type_description || null,
      magic: attributes.magic || null,
      trid: attributes.trid || [],
      tags: attributes.tags || [],
      votes: attributes.total_votes || null,
      names: attributes.names || [],
      first_submission_date: attributes.first_submission_date || null,
      last_submission_date: attributes.last_submission_date || null,
      last_analysis_date: attributes.last_analysis_date || null,
      first_seen_itw_date: attributes.first_seen_itw_date || null
    };

    const status = maliciousCount > 0 ? 'malicious' : 'safe';
    const message = maliciousCount > 0 
      ? 'This target has been flagged by multiple threat intelligence engines.' 
      : 'No threats detected. The target appears clean based on current global threat intelligence feeds.';

    return {
      status,
      message,
      stats: { malicious: maliciousCount, total: totalCount },
      vendors: vendors,
      details: details
    };
}
