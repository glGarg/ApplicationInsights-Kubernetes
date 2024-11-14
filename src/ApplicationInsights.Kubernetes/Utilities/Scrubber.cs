// ---------------------------------------------------------------------------
// <copyright file="Scrubber.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// ---------------------------------------------------------------------------

namespace Microsoft.ApplicationInsights.Kubernetes
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;

    public class Scrubber
    {
        internal record LocalizedWord(string Text, CultureInfo Culture);
        private static IEnumerable<LocalizedWord> DisallowedWords { get; } = ScrubberHelpers.LoadDisallowedWords();

        public static string ScrubData(string data, char replacementChar, CultureInfo culture)
        {
            foreach (var word in DisallowedWords)
            {
                if (culture.Equals(CultureInfo.InvariantCulture) || culture.Equals(word.Culture))
                {
                    data = data.Replace(word.Text, replacementChar.ToString(), ignoreCase: true, culture);
                }
            }

            return data;
        }
    }
}
