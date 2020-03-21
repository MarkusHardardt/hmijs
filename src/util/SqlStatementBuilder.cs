using MySql.Data.MySqlClient;
using System.Collections.Generic;
using System.Data;
using System.Text;

namespace hmijs.util
{
    public interface ISqlStatementBuilder
    {
        /// <summary>
        /// Maximum size in bytes of a packet or a generated/intermediate string.
        /// </summary>
        int MaxAllowedPacket { get; set; }

        /// <summary>
        /// Add all columns requested for a SELECT result.
        /// Note: Add colimns names only or expressions like "ColumnName as SomeName".
        /// </summary>
        /// <param name="expression">The column expression string</param>
        void AddColumn(string expression);

        /// <summary>
        /// Add all joins requested for a SELECT result.
        /// </summary>
        /// <param name="expression">The join expression string</param>
        void AddJoin(string expression);

        /// <summary>
        /// Add where-expression used for SELECT's, UPDATE's and DELETE's.
        /// </summary>
        /// <param name="expression">The where-expression string</param>
        /// <param name="and">If more then one where expressions must used with this flag you may configure if all expressions should be combined with the AND or OR keyword.</param>
        void AddWhere(string expression, bool and);

        /// <summary>
        /// Add values used for INSERT's and UPDATE's.
        /// </summary>
        /// <param name="column">The respective tabel column.</param>
        /// <param name="data">The actual data.</param>
        /// <param name="apostrophes">If this flag is true, the actual data will be written inside single quotes.</param>
        void AddValue(string column, string data, bool apostrophes);

        /// <summary>
        /// Clear all added columns, wheres, joins and values. Will be called automatically when the formatter for the query has performed.
        /// </summary>
        void Clear();

        /// <summary>
        /// Formats a SELECT statement using all previously added columns, wheres and joins.
        /// </summary>
        /// <param name="table">Database table to use.</param>
        /// <param name="group">Optional group expression (may be null).</param>
        /// <param name="order">Optional sort order expression for the results (may be null).</param>
        /// <param name="limit">Optional limit (will only be used if bigger zero)</param>
        /// <returns>The generated SQL statement.</returns>
        string BuildSelectStatement(string table, string group, string order, int limit);

        /// <summary>
        /// Formats an INSERT statement using all previously added values.
        /// </summary>
        /// <param name="table">Database table to use.</param>
        /// <returns>A list of inser statements</returns>
        IReadOnlyList<string> BuildInsertStatements(string table);

        /// <summary>
        /// Formats an UPDATE statement using all previously added values and wheres.
        /// </summary>
        /// <param name="table">Database table to use.</param>
        /// <param name="order">Optional sort order expression for the results (may be null).</param>
        /// <param name="limit">Optional limit (will only be used if bigger zero)</param>
        /// <returns></returns>
        string BuildUpdateStatement(string table, string order, int limit);

        /// <summary>
        /// Formats a DELETE statement using all previously added wheres.
        /// </summary>
        /// <param name="table">Database table to use.</param>
        /// <param name="order">Optional sort order expression for the results (may be null).</param>
        /// <param name="limit">Optional limit (will only be used if bigger zero)</param>
        /// <returns></returns>
        string BuildDeleteStatement(string table, string order, int limit);

        /// <summary>
        /// Handles tree structured data identified by paths.
        /// </summary>
        /// <param name="table">Database table to use.</param>
        /// <param name="column">Column containing the path strings.</param>
        /// <param name="parentPath">The respective parent path.</param>
        /// <param name="delimiter">The path part delimiter.</param>
        /// <returns>Returns a list of nodes (may be empty).</returns>
        string BuildGetChildrenStatement(string table, string column, string parentPath, string delimiter);

        /// <summary>
        /// Will return a node instance build from our passed parameter.
        /// </summary>
        /// <param name="childName">The nodes name</param>
        /// <param name="parentPath">The parent path</param>
        /// <param name="delimiter">The delimiter used in the path</param>
        /// <returns>A node instance</returns>
        Node GetChildNode(string childName, string parentPath, string delimiter);
    }

    /// <summary>
    /// The node structure for the GetChildNodes method.
    /// </summary>
    public struct Node
    {
        /// <summary>
        /// The name of the node.
        /// </summary>
        public string Name;

        /// <summary>
        /// The full path of the node.
        /// </summary>
        public string Path;

        /// <summary>
        /// Flag ist true if the node represents a leaf. Otherwise child nodes are available.
        /// </summary>
        public bool IsLeaf;
    }

    public class SqlStatementBuilder : ISqlStatementBuilder
    {
        public SqlStatementBuilder()
        {
            _columns = new List<string>();
            _joins = new List<string>();
            _wheres = new List<Where>();
            _values = new List<Value>();
            MaxAllowedPacket = 16777216; // (16M) >= MariaDB 10.2.4 
        }
        private List<string> _columns;
        private List<string> _joins;
        private List<Where> _wheres;
        private List<Value> _values;

        public int MaxAllowedPacket { get; set; }

        public void Clear()
        {
            _values.Clear();
            _columns.Clear();
            _joins.Clear();
            _wheres.Clear();
        }

        public void AddColumn(string expression)
        {
            _columns.Add(expression);
        }

        public void AddJoin(string expression)
        {
            _joins.Add(expression);
        }

        public void AddWhere(string expression, bool and)
        {
            _wheres.Add(new Where()
            {
                Expression = expression,
                Operator = and ? " AND " : " OR "
            });
        }

        public void AddValue(string column, string data, bool apostrophes)
        {
            for (int i = 0, l = _values.Count; i < l; i++)
            {
                Value value = _values[i];
                if (value.Column.Equals(column))
                {
                    value.Data.Add(data);
                    return;
                }
            }
            var strings = new List<string>();
            strings.Add(data);
            _values.Add(new Value()
            {
                Column = column,
                Data = strings,
                Apostrophes = apostrophes
            });
        }

        public string BuildSelectStatement(string table, string group, string order, int limit)
        {
            var query = new StringBuilder();
            query.Append("SELECT");
            // COLUMNS
            for (int i = 0, l = _columns.Count; i < l; i++)
            {
                if (i > 0)
                {
                    query.Append(',');
                }
                query.Append(' ');
                query.Append(_columns[i]);
            }
            // TABLE
            query.Append(" FROM ");
            query.Append(table);
            // JOINS
            for (int i = 0, l = _joins.Count; i < l; i++)
            {
                query.Append(' ');
                query.Append(_joins[i]);
            }
            // WHERE
            if (_wheres.Count > 0)
            {
                query.Append(" WHERE ");
                for (int i = 0, l = _wheres.Count; i < l; i++)
                {
                    var expr = _wheres[i];
                    if (i > 0)
                    {
                        query.Append(expr.Operator);
                    }
                    query.Append(expr.Expression);
                }
            }
            // GROUP
            if (!string.IsNullOrEmpty(group))
            {
                query.Append(" GROUP BY ");
                query.Append(group);
            }
            // ORDER
            if (!string.IsNullOrEmpty(order))
            {
                query.Append(" ORDER BY ");
                query.Append(order);
            }
            // LIMIT
            if (limit > 0)
            {
                query.Append(" LIMIT ");
                query.Append(limit);
            }
            // clear, perform query, check for errors and return result
            Clear();
            return query.ToString();
        }

        public IReadOnlyList<string> BuildInsertStatements(string table)
        {
            var queries = new List<string>();
            var insert = new StringBuilder();
            insert.Append("INSERT INTO ");
            insert.Append(table);
            insert.Append(" (");
            // COLUMN NAMES
            int max = 1;
            //var max = 1, i, l, values = this._values, value, data;
            for (int i = 0, l = _values.Count; i < l; i++)
            {
                if (i > 0)
                {
                    insert.Append(", ");
                }
                var value = _values[i];
                insert.Append(value.Column);
                if (value.Data.Count > max)
                {
                    max = value.Data.Count;
                }
            }
            insert.Append(") VALUES");
            if (max == 1)
            {
                insert.Append("(");
                // COLUMN VALUES
                for (int i = 0, l = _values.Count; i < l; i++)
                {
                    var value = _values[i];
                    if (i > 0)
                    {
                        insert.Append(", ");
                    }
                    if (value.Data[0] == null)
                    {
                        insert.Append("NULL");
                    }
                    else
                    {
                        if (value.Apostrophes)
                        {
                            insert.Append("'");
                        }
                        insert.Append(value.Data[0]);
                        if (value.Apostrophes)
                        {
                            insert.Append("'");
                        }
                    }
                }
                insert.Append(")");
                Clear();
                queries.Add(insert.ToString());
            }
            else
            {
                var query = new StringBuilder();
                var inserts = new List<string>();
                for (int d = 0; d < max; d++)
                {
                    query.Append('(');
                    // COLUMN VALUES
                    for (int i = 0, l = _values.Count; i < l; i++)
                    {
                        var value = _values[i];
                        if (i > 0)
                        {
                            query.Append(", ");
                        }
                        if (value.Data[d] == null)
                        {
                            query.Append("NULL");
                        }
                        else
                        {
                            if (value.Apostrophes)
                            {
                                query.Append("'");
                            }
                            query.Append(value.Data[d]);
                            if (value.Apostrophes)
                            {
                                query.Append("'");
                            }
                        }
                    }
                    query.Append(')');
                    inserts.Add(query.ToString());
                }
                Clear();
                query.Clear();
                query.Append(insert.ToString());
                int idx = 0, count = inserts.Count;
                while (idx < count)
                {
                    query.Append(inserts[idx]);
                    if (idx < count - 1)
                    {
                        var nxt = inserts[idx + 1];
                        if (query.Length + 1 + nxt.Length > MaxAllowedPacket)
                        {
                            queries.Add(query.ToString());
                            query.Clear();
                            query.Append(insert.ToString());
                        }
                        else
                        {
                            query.Append(',');
                        }
                    }
                    else
                    {
                        queries.Add(query.ToString());
                    }
                    idx++;
                }
            }
            return queries;
        }

        public string BuildUpdateStatement(string table, string order, int limit)
        {
            var query = new StringBuilder();
            query.Append("UPDATE ");
            query.Append(table);
            query.Append(" SET ");
            // COLUMN NAMES AND VALUES
            for (int i = 0, l = _values.Count; i < l; i++)
            {
                var value = _values[i];
                if (i > 0)
                {
                    query.Append(", ");
                }
                query.Append(value.Column);
                query.Append(" = ");
                if (value.Data[0] == null)
                {
                    query.Append("NULL");
                }
                else
                {
                    if (value.Apostrophes)
                    {
                        query.Append("'");
                    }
                    query.Append(value.Data[0]);
                    if (value.Apostrophes)
                    {
                        query.Append("'");
                    }
                }
            }
            // WHERE
            if (_wheres.Count > 0)
            {
                query.Append(" WHERE ");
                for (int i = 0, l = _wheres.Count; i < l; i++)
                {
                    var expr = _wheres[i];
                    if (i > 0)
                    {
                        query.Append(expr.Operator);
                    }
                    query.Append(expr.Expression);
                }
            }
            // ORDER
            if (!string.IsNullOrEmpty(order))
            {
                query.Append(" ORDER BY ");
                query.Append(order);
            }
            // LIMIT
            if (limit > 0)
            {
                query.Append(" LIMIT ");
                query.Append(limit);
            }
            // clear, perform query, check for errors and return result
            Clear();
            return query.ToString();
        }

        public string BuildDeleteStatement(string table, string order, int limit)
        {
            var query = new StringBuilder();
            query.Append("DELETE FROM ");
            query.Append(table);
            // WHERE
            if (_wheres.Count > 0)
            {
                query.Append(" WHERE ");
                for (int i = 0, l = _wheres.Count; i < l; i++)
                {
                    var expr = _wheres[i];
                    if (i > 0)
                    {
                        query.Append(expr.Operator);
                    }
                    query.Append(expr.Expression);
                }
            }
            // ORDER
            if (!string.IsNullOrEmpty(order))
            {
                query.Append(" ORDER BY ");
                query.Append(order);
            }
            // LIMIT
            if (limit > 0)
            {
                query.Append(" LIMIT ");
                query.Append(limit);
            }
            // clear, perform query, check for errors and return result
            Clear();
            return query.ToString();
        }

        public string BuildGetChildrenStatement(string table, string column, string parentPath, string delimiter)
        {
            var delim = MySqlHelper.EscapeString(delimiter);
            var col = new StringBuilder();
            col.Append("DISTINCT IF(LOCATE(");
            col.Append(delim);
            col.Append(", ");
            col.Append(table);
            col.Append('.');
            col.Append(column);
            col.Append(", ");
            col.Append(parentPath.Length + 1);
            col.Append(") > 0, SUBSTRING(");
            col.Append(table);
            col.Append('.');
            col.Append(column);
            col.Append(", ");
            col.Append(parentPath.Length + 1);
            col.Append(", (LOCATE(");
            col.Append(delim);
            col.Append(", ");
            col.Append(table);
            col.Append('.');
            col.Append(column);
            col.Append(", ");
            col.Append(parentPath.Length + 1);
            col.Append(") - ");
            col.Append(parentPath.Length);
            col.Append(")), SUBSTRING(");
            col.Append(table);
            col.Append('.');
            col.Append(column);
            col.Append(", ");
            col.Append(parentPath.Length + 1);
            col.Append(", LENGTH(");
            col.Append(table);
            col.Append('.');
            col.Append(column);
            col.Append("))) AS child");
            AddColumn(col.ToString());
            AddWhere($"LOCATE('{ MySqlHelper.EscapeString(parentPath)}', '{table}'.'{ column}') = 1", true);
            return BuildSelectStatement(table, null, null, 0);
        }

        public Node GetChildNode(string childName, string parentPath, string delimiter)
        {
            int pos = childName.IndexOf(delimiter);
            bool leaf = pos != (childName.Length - delimiter.Length);
            return new Node()
            {
                Name = leaf ? childName : childName.Substring(0, pos),
                Path = parentPath + childName,
                IsLeaf = leaf
            };
        }

        /// <summary>
        /// Builds the connection string 
        /// </summary>
        /// <param name="server">The name or network address of the instance of MySQL to which to connect.</param>
        /// <param name="port">The port MySQL is using to listen for connections.</param>
        /// <param name="database">The name of the database to use intially.</param>
        /// <param name="user">The MySQL login account being used.</param>
        /// <param name="password">The password for the MySQL account being used.</param>
        /// <param name="pooling">When true, the MySqlConnection object is drawn from the appropriate pool, or if necessary, is created and added to the appropriate pool.</param>
        /// <returns></returns>
        public static string BuildConnectionString(string server, uint port, string database, string user, string password, bool pooling)
        {
            // read: https://dev.mysql.com/doc/dev/connector-net/8.0/html/P_MySql_Data_MySqlClient_MySqlConnection_ConnectionString.htm
            var conStrBld = new MySqlConnectionStringBuilder
            {
                // The length of time (in seconds) to wait for a connection to the server before terminating the attempt and generating an error. 
                ConnectionTimeout = 5,
                // The name or network address of the instance of MySQL to which to connect. 
                // Multiple hosts can be specified separated by &. This can be useful where multiple MySQL servers are configured for replication 
                // and you are not concerned about the precise server you are connecting to. 
                // No attempt is made by the provider to synchronize writes to the database so care should be taken when using this option. 
                // In Unix environment with Mono, this can be a fully qualified path to MySQL socket filename. 
                // With this configuration, the Unix socket will be used instead of TCP / IP socket.Currently only a single socket name 
                // can be given so accessing MySQL in a replicated environment using Unix sockets is not currently supported.
                Server = server,
                // The port MySQL is using to listen for connections. This value is ignored if the connection protocol is anything but socket. 
                Port = port,
                // The name of the database to use intially.
                Database = database,
                // The MySQL login account being used.
                UserID = user,
                // The password for the MySQL account being used.
                Password = password,
                // When a connection is returned to the pool, its creation time is compared with the current time, 
                // and the connection is destroyed if that time span (in seconds) exceeds the value specified by Connection Lifetime. 
                // This is useful in clustered configurations to force load balancing between a running server and a server just brought online. 
                // A value of zero(0) causes pooled connections to have the maximum connection timeout.
                ConnectionLifeTime = 5,
                // The maximum number of connections allowed in the pool.
                MaximumPoolSize = 20,
                // The minimum number of connections allowed in the pool.
                MinimumPoolSize = 0,
                // When true, the MySqlConnection object is drawn from the appropriate pool, or if necessary, is created and added to the appropriate pool.
                // Recognized values are true, false, yes, and no. 
                Pooling = pooling
            };
            return conStrBld.ToString();
        }
    }

    internal struct Where
    {
        public string Expression;
        public string Operator;
    }
    internal struct Value
    {
        public string Column;
        public List<string> Data;
        public bool Apostrophes;
    }
}