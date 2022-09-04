use strict;
my $result = system("node index.js && node difr-checker.js");
printf "Result: %s\n", $result;
