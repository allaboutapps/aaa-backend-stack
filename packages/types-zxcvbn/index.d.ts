// via https://github.com/dropbox/zxcvbn/issues/203

declare module 'zxcvbn' {

    namespace zxcvbn {

        interface IZxcvbnOptions {
            user_inputs?: string[];
            feedback_messages?: IZxcvbnFeedbackMessages;
        }

        interface IZxcvbnFeedbackMessages {
            use_a_few_words?: string;
            no_need_for_mixed_chars?: string;
            uncommon_words_are_better?: string;
            straight_rows_of_keys_are_easy?: string;
            short_keyboard_patterns_are_easy?: string;
            use_longer_keyboard_patterns?: string;
            repeated_chars_are_easy?: string;
            repeated_patterns_are_easy?: string;
            avoid_repeated_chars?: string;
            sequences_are_easy?: string;
            avoid_sequences?: string;
            recent_years_are_easy?: string;
            avoid_recent_years?: string;
            avoid_associated_years?: string;
            dates_are_easy?: string;
            avoid_associated_dates_and_years?: string;
            top10_common_password?: string;
            top100_common_password?: string;
            very_common_password?: string;
            similar_to_common_password?: string;
            a_word_is_easy?: string;
            names_are_easy?: string;
            common_names_are_easy?: string;
            capitalization_doesnt_help?: string;
            all_uppercase_doesnt_help?: string;
            reverse_doesnt_help?: string;
            substitution_doesnt_help?: string;
        }

        interface ISequenceEntry {

            /**
             * Name of the pattern used.
             */
            pattern: 'repeat' | 'dictionary' | 'reverse_dictionary' | 'l33t' | 'spatial' | 'sequence' | 'regex' | 'date';

            /**
             * Part of the password that was match.
             */
            token: string;

            /**
             * Start index of the token found.
             */
            i: number;

            /**
             * End index of the token.
             */
            j: number;

            /**
             * estimated guesses needed to crack password
             */
            guesses: number;

            /**
             * order of magnitude of result.guesses
             */
            guesses_log10: number;
        }

        interface IZxcvbnResult {

            /**
             * estimated guesses needed to crack password
             */
            guesses: number;

            /**
             * order of magnitude of result.guesses
             */
            guesses_log10: number;

            /**
             * dictionary of back-of-the-envelope crack time
             * estimations, in seconds, based on a few scenarios:
             */
            crack_times_seconds: {
                /**
                 * online attack on a service that ratelimits password auth attempts.
                 */
                online_throttling_100_per_hour: number;
                /**
                 * online attack on a service that doesn't ratelimit,
                 * or where an attacker has outsmarted ratelimiting.
                 */
                online_no_throttling_10_per_second: number;
                /**
                 * offline attack. assumes multiple attackers,
                 * proper user-unique salting, and a slow hash function
                 *  w/ moderate work factor, such as bcrypt, scrypt, PBKDF2.
                 */
                offline_slow_hashing_1e4_per_second: number;
                /**
                 * offline attack with user-unique salting but a fast hash
                 *  function like SHA-1, SHA-256 or MD5. A wide range of
                 *  reasonable numbers anywhere from one billion - one trillion
                 *   guesses per second, depending on number of cores and machines.
                 *  ballparking at 10B/sec.
                 */
                offline_fast_hashing_1e10_per_second: number;
            }

            /**
             * same keys as result.crack_times_seconds,
             * with friendlier display string values:
             * "less than a second", "3 hours", "centuries", etc.
             */
            crack_times_display: {
                online_throttling_100_per_hour: string;
                online_no_throttling_10_per_second: string;
                offline_slow_hashing_1e4_per_second: string;
                offline_fast_hashing_1e10_per_second: string
            }

            /**
             * Integer from 0-4 (useful for implementing a strength bar)
             * 0 # too guessable: risky password. (guesses < 10^3)
             * 1 # very guessable: protection from throttled online attacks. (guesses < 10^6)
             * 2 # somewhat guessable: protection from unthrottled online attacks. (guesses < 10^8)
             * 3 # safely unguessable: moderate protection from offline slow-hash scenario. (guesses < 10^10)
             * 4 # very unguessable: strong protection from offline slow-hash scenario. (guesses >= 10^10)
             */
            score: number;

            /**
             * verbal feedback to help choose better passwords. set when score <= 2.
             */
            feedback?: IZxcvbnFeedback;

            /**
             * the list of patterns that zxcvbn based the
             * guess calculation on.
             */
            sequence: ISequenceEntry[];

            /**
             * how long it took zxcvbn to calculate an answer,
             * in milliseconds.
             */
            calc_time: number;
        }

        interface IZxcvbnFeedback {
            /**
             * explains what's wrong, eg. 'this is a top-10 common password'
             * not always set -- sometimes an empty string
             */
            warning: string;
            /**
             * a possibly-empty list of suggestions to help choose a less
             * guessable password. eg. 'Add another word or two'
             */
            suggestions: string[];
        }


    }

    function zxcvbn(password: string, userInputsOrOptions?: string[] | zxcvbn.IZxcvbnOptions): zxcvbn.IZxcvbnResult;

    export = zxcvbn;
}