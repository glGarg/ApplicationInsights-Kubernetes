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
    using System.Text;
    using System.Text.RegularExpressions;

    public class Scrubber
    {
        public const string EmailRegExPattern = @"[a-zA-Z0-9!#$+\-^_~]+(?:\.[a-zA-Z0-9!#$+\-^_~]+)*@(?:[a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,6}";
        public static string ScrubData(string data, char replacementChar)
        {
            StringBuilder scrubbedData = new StringBuilder();
            Regex rx = new Regex(EmailRegExPattern);
            int lastMatchEnd = 0;

            foreach (Match match in rx.Matches(data))
            {
                // Append the portion of the string not included in the match
                scrubbedData.Append(data.Substring(lastMatchEnd, match.Index - lastMatchEnd));

                // Append the scrubbed match
                string replacementString = new string(replacementChar, match.Value.Length);
                scrubbedData.Append(replacementString);

                // Update the position after the last match
                lastMatchEnd = match.Index + match.Length;
            }

            // Append the remainder of the string after the last match
            scrubbedData.Append(data.Substring(lastMatchEnd));

            return scrubbedData.ToString();
        }
    }
}
