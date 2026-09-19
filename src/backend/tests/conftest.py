import os
import sys

# Isolate SQLite user database during tests to protect development database
_data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
os.environ["USER_SQLITE_PATH"] = os.path.join(_data_dir, "naviops_users_test.db")
