// ---------------------------------------------------------------------------
// <copyright file="Scrubber.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace Microsoft.ApplicationInsights.Kubernetes
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text.RegularExpressions;

    public class Scrubber
    {
        public const string EmailRegExPattern = @"[a-zA-Z0-9!#$+\-^_~]+(?:\.[a-zA-Z0-9!#$+\-^_~]+)*@(?:[a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,6}";
        public static string ScrubData(string data, char replacementChar)
        {
            StringBuilder scrubbedData = new StringBuilder();
            Regex rx = new Regex(EmailRegExPattern);
            int prevIndex = 0;

            foreach (Match match in rx.Matches(data))
            {
                // Append the data prior to the match
                scrubbedData.Append(data.Substring(prevIndex, match.Index - prevIndex));
                // Append the replacement string
                scrubbedData.Append(new string(replacementChar, match.Length));
                prevIndex = match.Index + match.Length;
            }

            // Append the remaining data after the last match
            scrubbedData.Append(data.Substring(prevIndex));

            return scrubbedData.ToString();
        }
    }
}
