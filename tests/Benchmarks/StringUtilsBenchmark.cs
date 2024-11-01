using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;
using BenchmarkDotNet.Configs;
using Microsoft.ApplicationInsights.Kubernetes;

namespace Benchmarks
{
    [JsonExporterAttribute.Full]
    [MemoryDiagnoser]
    public class StringUtilsBenchmark
    {
        [Params(25, 1023, 1024, 1025, 2097152, 3758096384, 3848290697216)]
        public long Input { get; set; }

        [Benchmark]
        public string BenchmarkGetReadableSize()
        {
            return StringUtils.GetReadableSize(Input);
        }
    }
}
