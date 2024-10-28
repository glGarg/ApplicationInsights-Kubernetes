using BenchmarkDotNet.Attributes;
using Microsoft.ApplicationInsights.Kubernetes;

namespace Benchmarks;
[MemoryDiagnoser]
public class ScrubberBenchmark
{
    private const string SampleData = "Contact example@example.com for more information.";
    private const char ReplacementChar = '*';

    [Benchmark]
    public void BenchmarkScrubData()
    {
        Scrubber.ScrubData(SampleData, ReplacementChar);
    }
}
