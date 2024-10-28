using BenchmarkDotNet.Running;
using BenchmarkDotNet.Configs;

namespace Benchmarks;

public class Program
{
    public static void Main(string[] args)
    {
        var config = ManualConfig.Create(DefaultConfig.Instance).WithArtifactsPath("artifacts").WithOptions(ConfigOptions.JoinSummary);
        var stringUtilsSummary = BenchmarkRunner.Run<StringUtilsBenchmark>(config);
        var scrubberSummary = BenchmarkRunner.Run<ScrubberBenchmark>(config);
    }
}
