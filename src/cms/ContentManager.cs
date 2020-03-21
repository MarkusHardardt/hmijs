using MySql.Data.MySqlClient;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace hmijs.cms 
{
    public interface IMySqlConnectionFactory
    {
        MySqlConnection GetConnection();
    }
    
    public class ContentManager
    {
        public const string INSERT = "insert";
        public const string UPDATE = "update";
        public const string DELETE = "delete";
        public const string COPY = "copy";
        public const string MOVE = "move";
        public const string NONE = "none";

        public ContentManager (IMySqlConnectionFactory connectionFactory, JObject config)
        {
            if (connectionFactory == null)
            {
                throw new Exception("No database access provider available!");
            }
            else if (config == null)
            {
                throw new Exception("No database configuration available!");
            }
            _sqlConnectionFactory = connectionFactory;
            var languages = (JArray)config["languages"];
            var tables = (JArray)config["tables"];
            // get languages
            _languages = new List<string>();
            foreach (var lang in languages)
            {
                _languages.Add((string)lang);
            }
            _tablesForExt = new Dictionary<string, Table>();
            _iconDirectory = config.ContainsKey("icon_dir") ? (string)config.GetValue("icon_dir") : "";
            _folderIcon = config.ContainsKey("folder_icon") ? (string)config.GetValue("folder_icon") : "";
            var extensions = new List<string>();
            foreach (var tab in tables)
            {
                if (tab is JObject jTable)
                {
                    var extension = (string) jTable["extension"];
                    if (!_validExtensionRegex.IsMatch(extension))
                    {
                        throw new Exception($"Invalid extension: '{extension}'");
                    }
                    else if (_tablesForExt.ContainsKey(extension))
                    {
                        throw new Exception($"Extension already exists: '{extension}'");
                    }
                    extensions.Add(extension);
                    var table = new Table()
                    {
                        Name = (string)jTable["name"],
                        Extension = extension,
                        KeyColumn = (string)jTable["key_column"],
                        Json = jTable.ContainsKey("json") && (bool)jTable["json"],
                        Icon = (string)jTable["icon"],
                        Multiedit = jTable.ContainsKey("multiedit") && (bool)jTable["multiedit"],
                        ValueColumn = (string)jTable["value_column"],
                        ValueColumnPrefix = (string)jTable["value_column_prefix"]
                    };
                    if (!string.IsNullOrWhiteSpace(table.ValueColumnPrefix))
                    {
                        table.ValueColumns = new Dictionary<string, string>();
                        foreach (var language in _languages)
                        {
                            table.ValueColumns.Add(language, table.ValueColumnPrefix + language);
                        }
                    }
                    _tablesForExt[extension] = table;
                }
            }
            // we need all available extensions for building regular expressions
            var tabexts = string.Join("|", extensions);
            _key_regex = new Regex(@"^\$((?:" + _validNameCharacters + @"+\/)*?" + _validNameCharacters + @"+?)\.(" + tabexts + @")$", RegexOptions.Compiled);
            _refactoring_match = @"((?:" + _validNameCharacters + @"+\/)*?" + _validNameCharacters + @"+?\.(?:" + tabexts + @"))\b";
            // Note: In JS we use ('|")? instead of ('|"|) for single, double or no quotes (and \1 as backreference)
            _include_regex_build = new Regex("('|\"|)include:\\$((?:" + _validNameCharacters + @"+\/)*" + _validNameCharacters + @"+?)\.(" + tabexts + @")\b\1", RegexOptions.Compiled);
            _exchange_header_regex = new Regex(@"\[\{\((" + tabexts + "|language|" + RegexHelper.Escape(_exchangeHeader) + @")<>([a-f0-9]{32})\)\}\]\n(.*)\n", RegexOptions.Compiled);
            _sqlStatementBuilder = new SqlStatementBuilder();
        }

        private IMySqlConnectionFactory _sqlConnectionFactory;
        private string _iconDirectory;
        private string _folderIcon;
        private List<string> _languages;
        private Dictionary<string, Table> _tablesForExt;
        private Regex _key_regex;
        private string _refactoring_match;
        private Regex _include_regex_build;
        private Regex _exchange_header_regex;
        private SqlStatementBuilder _sqlStatementBuilder;

        public IReadOnlyList<string> GetLanguages()
        {
            return _languages;
        }

        public bool IsValidFile(string key)
        {
            return _key_regex.IsMatch(key);
        }

        public bool IsValidFolder(string key)
        {
            return _folderRegex.IsMatch(key);
        }

        public Descriptor GetDescriptor(string extension, Descriptor descriptor) {
            if (_tablesForExt.ContainsKey(extension))
            {
                var table = _tablesForExt[extension];
                descriptor.Json = table.Json;
                descriptor.Multilingual = !string.IsNullOrWhiteSpace(table.ValueColumnPrefix);
                descriptor.Multiedit = table.Multiedit;
            }
            return descriptor;
        }

        public Descriptor AnalyzeIdentifier(string identifier)
        {
            var match = _key_regex.Match(identifier);
            if (match.Success)
            {
                var descriptor = new Descriptor() { Identifier = identifier, Path = match.Groups[1].Value, File = identifier, Extension = match.Groups[2].Value };
                return GetDescriptor(match.Groups[2].Value, descriptor);
            }
            match = _folderRegex.Match(identifier);
            if (match.Success)
            {
                return new Descriptor() { Identifier = identifier,  Path = match.Groups[1].Value, Folder = identifier };
            }
            return new Descriptor() { Identifier = identifier };
        }

        public IReadOnlyList<Descriptor> GetDescriptors()
        {
            var list = new List<Descriptor>();
            foreach (var table in _tablesForExt)
            {
                list.Add(GetDescriptor(table.Key, new Descriptor()));
            }
            return list;
        }

        public string GetPath(string identifier)
        {
            var match = _key_regex.Match(identifier);
            return match.Success ? match.Groups[1].Value : null;
        }

        public string GetExtension(string identifier)
        {
            var match = _key_regex.Match(identifier);
            return match.Success ? match.Groups[2].Value : null;
        }

        public string GetIcon(string identifier)
        {
            var match = _key_regex.Match(identifier);
            if (match.Success)
            {
                string extension = match.Groups[2].Value;
                if (_tablesForExt.ContainsKey(extension))
                {
                    var table = _tablesForExt[extension];
                    return _iconDirectory + table.Icon;
                }
                else
                {
                    return null;
                }
            }
            else if (_folderRegex.IsMatch(identifier))
            {
                return _iconDirectory + _folderIcon;
            }
            else
            {
                return null;
            }
        }

        public int CompareIdentifier(string identifier1, string identifier2)
        {
            if (_folderRegex.IsMatch(identifier1))
            {
                if (_folderRegex.IsMatch(identifier2))
                {
                    return TextsAndNumbersComparer.CompareTextsAndNumbers(identifier1, identifier2, false, false);
                }
                else
                {
                    return TextsAndNumbersComparer.SMALLER;
                }
            }
            else
            {
                if (_folderRegex.IsMatch(identifier2))
                {
                    return TextsAndNumbersComparer.BIGGER;
                }
                else
                {
                    return TextsAndNumbersComparer.CompareTextsAndNumbers(identifier1, identifier2, false, false);
                }
            }
        }

        public object GetObject(string identifier, string language, bool include)
        {
            // This method works in four modes:
            // 1. json-object: build object and return
            // 2. plain text (utf-8): build text and return
            // 3. label/html with language selection: build string and return
            // 4. label/html without language selection: build strings and return as
            // object

            // first we try to get table object matching to the given key
            var match = _key_regex.Match(identifier);
            if (!match.Success)
            {
                throw new Exception($"Invalid id: '{identifier}'");
            }
            string extension = match.Groups[2].Value;
            if (!_tablesForExt.ContainsKey(extension))
            {
                throw new Exception($"Invalid table name: '{identifier}'");
            }
            var table = _tablesForExt[extension];
            using (var connection = _sqlConnectionFactory.GetConnection())
            {
                connection.Open();
                using (var command = connection.CreateCommand())
                {
                    command.CommandType = CommandType.Text;
                    command.CommandTimeout = 1000;
                    var key = match.Groups[1].Value;
                    // if jsonfx or plain text is available we decode the string and
                    // return with or without all includes included
                    if (!string.IsNullOrWhiteSpace(table.ValueColumn))
                    {
                        // note: no language required here because we got only one anyway
                        var rawString = _getRawString(command, table, key, null);
                        if (rawString != null)
                        {
                            var rawObject = table.Json ? JsonConvert.DeserializeObject(rawString) : rawString;
                            if (include)
                            {
                                var ids = new HashSet<string>();
                                ids.Add(identifier);
                                // TODO: cast to JToken may fail
                                // var i_object = _build(command, rawObject, ids, language);
                                //return parse ? JsonConvert.DeserializeObject(i_object.ToString()) : i_object;
                                return _include(command, rawObject, ids, language);
                            }
                            else
                            {
                                return rawObject;
                            }
                        }
                        else
                        {
                            return null;
                        }
                    }
                    else if (language != null)
                    {
                        // if selection is available we return string with or without all
                        // includes included
                        var rawString = _getRawString(command, table, key, language);
                        if (rawString != null)
                        {
                            if (include)
                            {
                                var ids = new HashSet<string>();
                                ids.Add(identifier);
                                return _include(command, rawString, ids, language);
                            }
                            else
                            {
                                return rawString;
                            }
                        }
                        else
                        {
                            return null;
                        }
                    }
                    else
                    {
                        foreach (var column in table.ValueColumns)
                        {
                            _sqlStatementBuilder.AddColumn($"{table.Name}.{column.Value} AS {column.Key}");
                        }
                        _sqlStatementBuilder.AddWhere($"{table.Name}.{table.KeyColumn} = '{MySqlHelper.EscapeString(key)}'", true);
                        command.CommandText = _sqlStatementBuilder.BuildSelectStatement(table.Name, null, null, 1);
                        var values = new Dictionary<string, string>();
                        using (var reader = command.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    values.Add(reader.GetName(i), reader.IsDBNull(i) ? "" : reader.GetString(i));
                                }
                            }
                            else
                            {
                                return null;
                            }
                        }
                        var jObject = new JObject();
                        foreach (var column in table.ValueColumns)
                        {
                            var text = values[column.Key];
                            var ids = new HashSet<string>();
                            ids.Add(identifier);
                            var includedObject = _include(command, text, ids, language);
                            // TODO: valid cast
                            if (includedObject is JToken token)
                            {
                                jObject.Add(column.Key, token);
                            }
                            else
                            {
                                jObject.Add(column.Key, new JValue(includedObject));
                            }
                        }
                        return jObject;
                    }
                }
            }
        }

        private string _getRawString(MySqlCommand command, Table table, string key, string language)
        {
            var column = string.IsNullOrWhiteSpace(table.ValueColumn) ? table.ValueColumns[language] : table.ValueColumn;
            if (column != null)
            {
                _sqlStatementBuilder.AddColumn($"{table.Name}.{column} AS {column}");
                _sqlStatementBuilder.AddWhere($"{table.Name}.{table.KeyColumn} = '{MySqlHelper.EscapeString(key)}'", true);
                command.CommandText = _sqlStatementBuilder.BuildSelectStatement(table.Name, null, null, 1);
                return (string)command.ExecuteScalar();
            }
            else
            {
                throw new Exception($"Invalid value column for table '{table.Name}' and language '{language}'");
            }
        }

        private const string INCLUDE = "include";

        /// <summary>
        /// This method handles the following kind of "includer" object types:
        /// - JArray: We iterate over all elements and call recursive and return the JArray.
        /// - JObject: We search for an include key. If found we try to include. 
        ///            In case of an included object we transfer overwrite properties and finally return as an JObject.
        /// - string: We seach for include expresisons containing valid keys, replace with the included content and return as string.
        /// - bool or number: We return as is.
        /// </summary>
        /// <param name="command">The SQL command</param>
        /// <param name="includer">The include array, object, string, bool or number</param>
        /// <param name="ids">Already included keys to prevent endless recursion</param>
        /// <param name="language">The required language</param>
        /// <returns></returns>
        private object _include(MySqlCommand command, object includer, HashSet<string> ids, string language)
        {
            if (includer is JArray includerArray)
            {
                return _includeArray(command, includerArray, ids, language);
            }
            else if (includer is JObject includerObject)
            {
                return _includeObject(command, includerObject, ids, language);
            }
            else if (includer is string includerString)
            {
                return _includeString(command, includerString, ids, language);
            }
            else if (includer is JValue jValue && JTokenType.String.Equals(jValue.Type))
            {
                return _includeString(command, (string)jValue, ids, language);
            }
            else
            {
                // if our input object is not an array, an object or a string we have
                // nothing to build so we return the object as is.
                return includer;
            }
        }

        private object _includeArray(MySqlCommand command, JArray includer, HashSet<string> ids, string language)
        {
            for (int i = 0, l = includer.Count; i < l; i++)
            {
                object value = _include(command, includer[i], ids, language);
                includer[i] = value is JToken jToken ? jToken : new JValue(value);
            }
            return includer;
        }

        private object _includeObject(MySqlCommand command, JObject includer, HashSet<string> ids, string language)
        {
            var includeKey = _getIncludeKey(includer);
            var match = includeKey != null && !ids.Contains(includeKey) ? _key_regex.Match(includeKey) : null;
            if (match == null || !match.Success)
            {
                _includeProperties(command, includer, ids, language);
                return includer;
            }
            string extension = match.Groups[2].Value;
            if (!_tablesForExt.ContainsKey(extension))
            {
                _includeProperties(command, includer, ids, language);
                return includer;
            }
            var table = _tablesForExt[extension];
            var rawString = _getRawString(command, table, match.Groups[1].Value, language);
            if (rawString != null)
            {
                ids.Add(includeKey);
                var rawObject = table.Json ? JsonConvert.DeserializeObject(rawString) : rawString;
                var includedObject = _include(command, rawObject, ids, language);
                ids.Remove(includeKey);
                if (includedObject is JObject jObject)
                {
                    // if we included an object all attributes except include must be copied
                    includer.Remove(INCLUDE);
                    _includeProperties(command, includer, ids, language);
                    // no attribute keeping - just attribute transfer
                    Utilities.TransferProperties(includer, jObject);
                    return jObject;
                }
                else
                {
                    // no real object means just return whatever it is
                    // TODO: this is a bug in 'hmijs': return rawObject;
                    return includedObject;
                }
            }
            else
            {
                // no string available so just step on with building the object properties
                _includeProperties(command, includer, ids, language);
                return includer;
            }
        }

        private static string _getIncludeKey(JObject includer)
        {
            // will be: JArray for [], JObject for {} and JValue for bool, int, float and string
            var include = includer[INCLUDE];
            return include is JValue jValue && JTokenType.String.Equals(jValue.Type) ? (string)include : null;
        }

        private object _includeString(MySqlCommand command, string includer, HashSet<string> ids, string language)
        {
            // Strings may contain include:$path/file.ext entries. With the next
            // Regex call we build an array containing strings and include matches.
            var array = new List<object>();
            RegexHelper.Each(_include_regex_build, includer, null, (start, end, match) => {
                if (match != null && !ids.Contains(_getFullName(match.Groups[2].Value, match.Groups[3].Value)))
                {
                    array.Add(match);
                }
                else
                {
                    array.Add(includer.Substring(start, end - start));
                }
            });
            // For all found include-matches we try to load the referenced content
            // from the database and replace the corresponding array element with
            // the included content.
            for (int i = 0; i < array.Count; i++)
            {
                if (array[i] is Match match)
                {
                    string extension = match.Groups[3].Value;
                    if (_tablesForExt.ContainsKey(extension))
                    {
                        var table = _tablesForExt[extension];
                        string key = match.Groups[2].Value;
                        string includeKey = _getFullName(key, extension);
                        var rawString = _getRawString(command, table, key, language);
                        if (rawString != null)
                        {
                            ids.Add(includeKey);
                            var rawObject = table.Json ? JsonConvert.DeserializeObject(rawString) : rawString;
                            var includedObject = _include(command, rawObject, ids, language);
                            ids.Remove(includeKey);
                            array[i] = table.Json && array.Count > 1 ? JsonConvert.SerializeObject(includedObject, Formatting.None) : includedObject;
                        }
                        else
                        {
                            // no raw string available means we replace with the original content
                            array[i] = match.Groups[0].Value;
                        }
                    }
                }
            }
            return array.Count == 1 ? array[0] : string.Join("", array);
        }

        private void _includeProperties(MySqlCommand command, JObject jObject, HashSet<string> ids, string language)
        {
            foreach (var property in jObject)
            {
                object value = _include(command, property.Value, ids, language);
                jObject[property.Key] = value is JToken jToken ? jToken : new JValue(value);
            }
        }

        private void _includeProperties_DEPRECATED(MySqlCommand command, object container, HashSet<string> ids, string language)
        {
            if (container is JArray jArray)
            {
                for (int i = 0, l = jArray.Count; i < l; i++)
                {
                    // TODO: cast to JToken may fail!!!
                    object value = _include(command, jArray[i], ids, language);
                    if (value is JToken jToken)
                    {
                        jArray[i] = jToken;
                    }
                    else
                    {
                        throw new Exception($"Value is no token: '{value}'");
                    }
                }
            }
            else if (container is JObject jObject)
            {
                foreach (var property in jObject)
                {
                    // PROPERTY: KeyValuePair<string, JToken>
                    // TODO: cast to JToken may fail!!!
                    object value = _include(command, property.Value, ids, language);
                    if (value is JToken jToken)
                    {
                        jObject[property.Key] = jToken;
                    }
                    else
                    {
                        throw new Exception($"Value is no token: '{value}'");
                    }
                }
            }
        }

        private static string _getFullName(string key, string extension)
        {
            return $"${key}.{extension}";
        }

        public bool Exists(string identifier)
        {
            var match = _key_regex.Match(identifier);
            if (match.Success)
            {
                string extension = match.Groups[2].Value;
                if (!_tablesForExt.ContainsKey(extension))
                {
                    throw new Exception($"Invalid table: '{identifier}'");
                }
                var table = _tablesForExt[extension];
                using (var sqlConnection = _sqlConnectionFactory.GetConnection())
                {
                    sqlConnection.Open();
                    using (var command = sqlConnection.CreateCommand())
                    {
                        command.CommandType = CommandType.Text;
                        command.CommandTimeout = 1000;
                        _sqlStatementBuilder.AddColumn("COUNT(*) AS cnt");
                        _sqlStatementBuilder.AddWhere($"{table.Name}.{table.KeyColumn} = '{MySqlHelper.EscapeString(match.Groups[1].Value)}'", true);
                        command.CommandText = _sqlStatementBuilder.BuildSelectStatement(table.Name, null, null, 0);
                        var result = command.ExecuteScalar();
                        var count = int.Parse(result.ToString());
                        return count > 0;
                    }
                }
            }
            else
            {
                return false;
            }
        }

        public string GetChecksum(string identifier)
        {
            // first we try to get table object matching to the given key
            var match = _key_regex.Match(identifier);
            if (!match.Success)
            {
                throw new Exception($"Invalid identifier: '{identifier}'");
            }
            string extension = match.Groups[2].Value;
            if (!_tablesForExt.ContainsKey(extension))
            {
                throw new Exception($"Invalid table name: '{identifier}'");
            }
            var table = _tablesForExt[extension];
            using (var sqlConnection = _sqlConnectionFactory.GetConnection())
            {
                sqlConnection.Open();
                using (var command = sqlConnection.CreateCommand())
                {
                    command.CommandType = CommandType.Text;
                    command.CommandTimeout = 1000;
                    var key = match.Groups[1].Value;
                    var raw = new StringBuilder();
                    raw.Append(identifier);
                    // if jsonfx or plain text is available we decode the string and
                    // return with or without all includes included
                    if (!string.IsNullOrWhiteSpace(table.ValueColumn))
                    {
                        raw.Append(':');
                        raw.Append(_getRawString(command, table, key, null));
                    }
                    else
                    {
                        foreach (var column in table.ValueColumns)
                        {
                            _sqlStatementBuilder.AddColumn($"{table.Name}.{column.Value} AS {column.Key}");
                        }
                        _sqlStatementBuilder.AddWhere($"{table.Name}.{table.KeyColumn} = '{MySqlHelper.EscapeString(key)}'", true);
                        command.CommandText = _sqlStatementBuilder.BuildSelectStatement(table.Name, null, null, 1);
                        using (var reader = command.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                foreach (var column in table.ValueColumns)
                                {
                                    raw.Append(':');
                                    raw.Append(column.Key);
                                    raw.Append(':');
                                    raw.Append(reader[column.Key]);
                                }
                            }
                        }
                    }
                    return Utilities.GetMD5(raw.ToString());
                }
            }
        }

        private static readonly IComparer _compareKeys = new TextsAndNumbersComparer()
        {
            IgnoreCase = false,
            Signed = false,
            Upward = true
        };

        private static ModificationParameter GetModificationParameter(string previous, string next)
        {
            // within the next condition checks we detect if the value is available
            // after the update and if the data will be changed
            if (!string.IsNullOrWhiteSpace(previous))
            {
                if (!string.IsNullOrWhiteSpace(next))
                {
                    if (!string.Equals(previous, next))
                    {
                        // both values available and different
                        return new ModificationParameter() { Empty = false, Changed = true, Text = next };
                    }
                    else
                    {
                        // both values available and equal
                        return new ModificationParameter() {Empty = false, Changed = false };
                    }
                }
                else
                {
                    // reset current value
                    return new ModificationParameter() { Empty = true, Changed = true };
                }
            }
            else
            {
                if (!string.IsNullOrWhiteSpace(previous))
                {
                    // new value available
                    return new ModificationParameter() { Empty = false, Changed = true, Text = next };
                }
                else
                {
                    // both values unavailable
                    return new ModificationParameter() { Empty = true, Changed = false};
                }
            }
        }

        private static readonly Regex _validExtensionRegex = new Regex(@"^\w+$", RegexOptions.Compiled);
        private const string _validNameCharacters = @"[a-zA-Z0-9_+\-*]";
        private static readonly Regex _folderRegex = new Regex(@"^\$((?:" + _validNameCharacters + @"+\/)*)$", RegexOptions.Compiled);
        private const string _exchangeHeader = "ltag-lpw-ctrl-config-exchange-data";
    }

    public struct Table
    {
        public string Name;
        public string Extension;
        public string KeyColumn;
        public bool Json;
        public string ValueColumn;
        public Dictionary<string, string> ValueColumns;
        public string ValueColumnPrefix;
        public string Icon;
        public bool Multiedit;
    }

    public struct ModificationParameter
    {
        public bool Empty;
        public bool Changed;
        public string Text;
    }

    public struct Descriptor
    {
        public string Identifier;
        public string Path;
        public string File;
        public string Extension;
        public string Folder;
        public bool Json;
        public bool Multilingual;
        public bool Multiedit;
    }

    internal static class CmsSqlStatementBuilder
    {
        static string BuildReferencesFromCondition(string escapedId, string valueColumn)
        {
            // search for keys in text within single quotation marks
            var query = new StringBuilder();
            query.Append("LOCATE(");
            query.Append(escapedId);
            query.Append(',');
            query.Append(valueColumn);
            query.Append(") > 0");
            return query.ToString();
        }

        static string BuildReferencesToLocate(string userTable, string userValueColumn, string usedTableAlias, string usedExtension, string usedKeyColumn)
        {
            // search for keys in text within single quotation marks
            var query = new StringBuilder();
            query.Append("LOCATE(CONCAT('$',");
            query.Append(usedTableAlias);
            query.Append('.');
            query.Append(usedKeyColumn);
            query.Append(",'.");
            query.Append(usedExtension);
            query.Append("'),");
            query.Append(userTable);
            query.Append('.');
            query.Append(userValueColumn);
            query.Append(") > 0");
            return query.ToString();
        }
        static string BuildReferencesToCondition(string userTable, object userValueColumn, string usedTable, string usedTableAlias, string usedExtension, string usedKeyColumn)
        {
            // search for keys in text within single quotation marks
            var query = new StringBuilder();
            query.Append("INNER JOIN ");
            query.Append(usedTable);
            query.Append(" AS ");
            query.Append(usedTableAlias);
            query.Append(" ON ");
            if (userValueColumn is string userValueColumnString)
            {
                query.Append(BuildReferencesToLocate(userTable, userValueColumnString, usedTableAlias, usedExtension, usedKeyColumn));
            }
            else
            {
                var userValueColumnDictionary = userValueColumn as IReadOnlyDictionary<string, string>;
                var next = false;
                foreach(var attr in userValueColumnDictionary)
                {
                    if (next)
                    {
                        query.Append(" OR ");
                    }
                    query.Append(BuildReferencesToLocate(userTable, attr.Value, usedTableAlias, usedExtension, usedKeyColumn));
                    next = true;
                }
            }
            return query.ToString();
        }
    }
    // TODO: move somwhere
    public static class Utilities
    {
        public static string GetMD5(string text)
        {
            using (var hash = MD5.Create())
            {
                // Convert the input string to a byte array and compute the hash.
                byte[] data = hash.ComputeHash(Encoding.UTF8.GetBytes(text));

                // Create a new Stringbuilder to collect the bytes
                // and create a string.
                var builder = new StringBuilder();

                // Loop through each byte of the hashed data 
                // and format each one as a hexadecimal string.
                for (int i = 0; i < data.Length; i++)
                {
                    builder.Append(data[i].ToString("x2"));
                }
                // Return the hexadecimal string.
                return builder.ToString();
            }
        }

        public static void TransferProperties(JToken source, JToken target)
        {
            if (source is JArray sourceArray && target is JArray targetArray)
            {
                for (int i = 0, l = sourceArray.Count; i < l; i++)
                {
                    _transferProperty(true, source, target, i);
                }
            }
            else if (source is JObject sourceObject && target is JObject targetObject)
            {
                foreach (var property in sourceObject.Properties())
                {
                    _transferProperty(false, source, target, property.Name);
                }
            }
        }

        private static void _transferProperty(bool arrayMode, JToken source, JToken target, object key)
        {
            var srcval = source[key];
            var tgtval = target[key];
            if (srcval is JArray srcvalArray)
            {
                // #1
                if (tgtval is JArray tgtvalArray)
                {
                    // #2
                    TransferProperties(srcval, tgtval);
                }
                else
                {
                    // #3
                    if (arrayMode)
                    {
                        target[key] = srcval;
                    }
                    else
                    {
                        /*
                        if (i_pre_include_source && tgtval !== undefined)
                        {
                            i_pre_include_source[key] = tgtval;
                        }
                        */
                        target[key] = srcval;
                    }
                }
            }
            else if (srcval is JObject srcvalObject)
            {
                // #4
                if (tgtval is JArray tgtvalArray)
                {
                    // #5
                    if (arrayMode)
                    {
                        target[key] = srcval;
                    }
                    else
                    {
                        /*
                        if (i_pre_include_source && tgtval !== undefined)
                        {
                            i_pre_include_source[key] = tgtval;
                        }
                        */
                        target[key] = srcval;
                    }
                }
                else if (tgtval is JObject tgtvalObject)
                {
                    // #6
                    TransferProperties(srcval, tgtval);
                }
                else
                {
                    // #7
                    if (arrayMode)
                    {
                        target[key] = srcval;
                    }
                    else
                    {
                        /*
                        if (i_pre_include_source && tgtval !== undefined)
                        {
                            i_pre_include_source[key] = tgtval;
                        }
                        */
                        target[key] = srcval;
                    }
                }
            }
            else if (srcval != null)
            {
                // #8
                if (arrayMode)
                {
                    target[key] = srcval;
                }
                else
                {
                    /*
                    if (i_pre_include_source && tgtval !== undefined)
                    {
                        i_pre_include_source[key] = tgtval;
                    }
                    */
                    target[key] = srcval;
                }
            }
        }

        public static void JsonHowTo()
        {
            // BOOLEAN: object(bool)
            var raw_bool = JsonConvert.DeserializeObject("false");
            var real_bool = (bool)JsonConvert.DeserializeObject("true");

            // INTEGER: object(long)
            var raw_long = JsonConvert.DeserializeObject("42");
            var real_long = (long)JsonConvert.DeserializeObject("23");

            // FLOAT: object(double)
            var raw_double = JsonConvert.DeserializeObject("1.618");
            var real_double = (double)JsonConvert.DeserializeObject("3.1415");

            // STRING: object(string)
            var raw_string = JsonConvert.DeserializeObject("\"Hello world\"");
            var real_string = (string)JsonConvert.DeserializeObject("\"Hello world of JSON\"");

            // OBJECT: object(JObject)
            var raw_JObject = JsonConvert.DeserializeObject("{\"key\":\"answer\",\"value\":42}");
            var real_JObject = (JObject)JsonConvert.DeserializeObject("{\"key\":\"answer\",\"value\":42}");

            // ARRAY: object(JArray)
            var raw_JArray = JsonConvert.DeserializeObject("[1.618, 2.718, 3.1415]"); 
            var real_JArray = (JArray)JsonConvert.DeserializeObject("[1.618, 2.718, 3.1415]");


            // OBJECT's:
            var jObject = (JObject)JsonConvert.DeserializeObject("{_bool:true, _int:42, _float:1.618, _string:\"hello world\", _object:{}, _array:[]}");
            var listFromObject = new List<object>();
            // OBJECT: FOREACH-LOOP - each: KeyValuePair<string, JToken>
            foreach (var property in jObject)
            {
                // PROPERTY: KeyValuePair<string, JToken>
                listFromObject.Add(property);
                listFromObject.Add(property.Key);
                listFromObject.Add(property.Value);
            }
            // OBJECT: FOREACH-LOOP - each: KeyValuePair<string, JToken>
            foreach (var property in jObject.Properties())
            {
                // PROPERTY: JProperty
                listFromObject.Add(property);
                listFromObject.Add(property.Name);
                listFromObject.Add(property.Value);
            }
            // OBJECT: directly
            var object_raw_bool = (JValue)jObject["_bool"];
            var object_real_bool = (bool)jObject["_bool"];

            var object_raw_long = (JValue)jObject["_int"];
            var object_real_long = (long)jObject["_int"];

            var object_raw_double = (JValue)jObject["_float"];
            var object_real_double = (double)jObject["_float"];

            var object_raw_string = (JValue)jObject["_string"];
            var object_real_string = (string)jObject["_string"];

            var object_raw_JObject = (JObject)jObject["_object"];

            var object_raw_JArray = (JArray)jObject["_array"];

            // this returns null
            var object_invalid_direct = jObject["InvalidPropertyName"];
            var object_invalid_method = jObject.GetValue("InvalidPropertyName");

            // ARRAY's:
            var jArray = (JArray)JsonConvert.DeserializeObject("[true, 42, 1.618, \"hello world\", {}, []]");
            var listFromArray = new List<object>();
            // ARRAY: FOR-LOOP
            for (int index = 0; index < jArray.Count; index++)
            {
                listFromArray.Add(jArray[index]);
            }
            // ARRAY: FOREACH-LOOP
            foreach (var element in jArray)
            {
                listFromArray.Add(element);
            }
            // ARRAY: directly
            var array_raw_bool = (JValue)jArray[0];
            var array_real_bool = (bool)jArray[0];

            var array_raw_long = (JValue)jArray[1];
            var array_real_long = (long)jArray[1];

            var array_raw_double = (JValue)jArray[2];
            var array_real_double = (double)jArray[2];

            var array_raw_string = (JValue)jArray[3];
            var array_real_string = (string)jArray[3];

            var array_raw_JObject = (JObject)jArray[4];

            var array_raw_JArray = (JArray)jArray[5];

            // TYPES
            var value = JsonConvert.DeserializeObject("true");
            if (value is JToken jToken)
            {
                switch (jToken.Type)
                {
                    case JTokenType.Boolean:
                        var b = jToken.Value<bool>();
                        break;
                    case JTokenType.Date:
                        var dt = jToken.Value<DateTime>();
                        break;
                    case JTokenType.Integer:
                        var i = jToken.Value<int>();
                        break;
                    case JTokenType.String:
                        var s = jToken.Value<string>();
                        break;
                    case JTokenType.Guid:
                        var g = jToken.Value<Guid>();
                        break;
                        /// several more
                }
            }
        }
    }


    // TODO: move somwhere
    public static class RegexHelper
    {
        // i_string.replace(/[-\/\\^$*+?.()|\[\]{}]/g, '\\$&');
        private static readonly Regex _escapeRegex = new Regex(@"[-\/\\^$*+?.()|\[\]{}]", RegexOptions.Compiled);
        public static string Escape(string text)
        {
            return _escapeRegex.Replace(text, @"\$&");
        }

        public delegate void CallBackFunction(int start, int end, Match match);

        public static void Each(Regex regex, string text, bool? matches, CallBackFunction callback)
        {
            int off = 0;
            // var res, off = 0, idx, len;
            // i_regex.lastIndex = 0;
            foreach (Match match in regex.Matches(text))
            {
                int idx = match.Index;
                int len = match.Groups[0].Value.Length;
                // if not only matches requested and not an empty string
                if (matches != true && idx > off)
                {
                    // call for text before next match
                    callback(off, idx, null);
                }
                // if not only the parts between the matches are requested
                if (matches != false)
                {
                    // call for matched text
                    callback(idx, idx + len, match);
                }
                // off = i_regex.LastIndex;
                off = idx + len;
                // if not global we do not loop
                if (len == 0)
                {
                    break;
                }
            }
            // if not only matches requested and not an empty string
            if (matches != true && off < text.Length)
            {
                // call for text behind last match
                callback(off, text.Length, null);
            }
        }
    }

    // TODO: move somwhere
    public class TextsAndNumbersComparer : IComparer
    {
        public TextsAndNumbersComparer()
        {
            IgnoreCase = false;
            Signed = false;
            Upward = true;
        }
        public bool IgnoreCase { get; set; }
        public bool Signed { get; set; }
        public bool Upward { get; set; }

        public int Compare(object object1, object object2)
        {
            if (object1 is string string1 && object1 is string string2)
            {
                var result = CompareTextsAndNumbers(string1, string2, IgnoreCase, Signed);
                return Upward ? result : -result;
            }
            throw new NotImplementedException();
        }
        /* Default compare results */
        public const int BIGGER = 1;
        public const int EQUAL = 0;
        public const int SMALLER = -1;

        /* ASCII codes */
        private const int MINUS = 45;
        private const int ZERO = 48;
        private const int NINE = 57;

        /// <summary>
        /// Compare strings containing numbers by their numeric value.
        /// </summary>
        /// <param name="string1">The first string to compare</param>
        /// <param name="string2">The second string to compare</param>
        /// <param name="ignoreCase">Flag for case insensitiv</param>
        /// <param name="signed">Flag for signed values</param>
        /// <returns></returns>
        public static int CompareTextsAndNumbers(string string1, string string2, bool ignoreCase, bool signed)
        {
            // NOTE: This algorithm seems to be incredibly slow on C#
            int o1 = 0, l1 = string1.Length, c1, nc1, e1, nl1, ni1;
            int o2 = 0, l2 = string2.Length, c2, nc2, e2, nl2, ni2;
            bool m1, m2;
            while (o1 < l1 && o2 < l2)
            {
                // get next character codes, check for minus and move index if required
                c1 = string1[o1];
                m1 = signed && c1 == MINUS && o1 + 1 < l1;
                if (m1)
                {
                    nc1 = string1[o1 + 1];
                    m1 = nc1 >= ZERO && nc1 <= NINE;
                    if (m1)
                    {
                        o1++;
                        c1 = nc1;
                    }
                }
                c2 = string2[o2];
                m2 = signed && c2 == MINUS && o2 + 1 < l2;
                if (m2)
                {
                    nc2 = string2[o2 + 1];
                    m2 = nc2 >= ZERO && nc2 <= NINE;
                    if (m2)
                    {
                        o2++;
                        c2 = nc2;
                    }
                }
                // first is a number
                if (c1 >= ZERO && c1 <= NINE)
                {
                    // second is a number too
                    if (c2 >= ZERO && c2 <= NINE)
                    {
                        // skip leading zeros and step to end of number of first string
                        if (c1 == ZERO)
                        {
                            while (o1 + 1 < l1)
                            {
                                c1 = string1[o1 + 1];
                                if (c1 == ZERO)
                                    o1++;
                                else if (c1 > ZERO && c1 <= NINE)
                                {
                                    o1++;
                                    break;
                                }
                                else
                                    break;
                            }
                        }
                        e1 = o1 + 1;
                        while (e1 < l1)
                        {
                            c1 = string1[e1];
                            if (c1 >= ZERO && c1 <= NINE)
                                e1++;
                            else
                                break;
                        }
                        // skip leading zeros and step to end of number of second string as well
                        if (c2 == ZERO)
                        {
                            while (o2 + 1 < l2)
                            {
                                c2 = string2[o2 + 1];
                                if (c2 == ZERO)
                                    o2++;
                                else if (c2 > ZERO && c2 <= NINE)
                                {
                                    o2++;
                                    break;
                                }
                                else
                                    break;
                            }
                        }
                        e2 = o2 + 1;
                        while (e2 < l2)
                        {
                            c2 = string2[e2];
                            if (c2 >= ZERO && c2 <= NINE)
                                e2++;
                            else
                                break;
                        }
                        // now o1/o2 point to our first digit and e1/e2 point to the
                        // first non-digit or end of string after our number
                        // compute number lengths
                        nl1 = e1 - o1;
                        nl2 = e2 - o2;
                        // handle different number lenghts
                        if (nl1 > nl2)
                            return m1 ? SMALLER : BIGGER;
                        else if (nl1 < nl2)
                            return m2 ? BIGGER : SMALLER;
                        // handle equal number lenghts
                        ni1 = o1;
                        ni2 = o2;
                        while (ni1 < e1)
                        {
                            c1 = m1 ? -string1[ni1] : string1[ni1];
                            c2 = m2 ? -string2[ni2] : string2[ni2];
                            if (c1 > c2)
                                return BIGGER;
                            else if (c1 < c2)
                                return SMALLER;
                            ni1++;
                            ni2++;
                        }
                        o1 = e1;
                        o2 = e2;
                    }
                    else
                        // second is not a number
                        return SMALLER;
                }
                // first is not a number
                else
                {
                    // second is a number
                    if (c2 >= ZERO && c2 <= NINE)
                        return BIGGER;
                    else
                    {
                        // second is not a number too
                        if (ignoreCase)
                        {
                            c1 = char.ToLower(string1[o1]);
                            c2 = char.ToLower(string2[o2]);
                        }
                        if (c1 > c2)
                            return BIGGER;
                        else if (c1 < c2)
                            return SMALLER;
                        o1++;
                        o2++;
                    }
                }
            }
            var dl = l1 - l2;
            return dl > 0 ? BIGGER : (dl < 0 ? SMALLER : EQUAL);
        }
    }
}