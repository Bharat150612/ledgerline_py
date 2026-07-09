"""
store.py — Data access layer (replaces store.ts)
Reads/writes employee records, preferring MongoDB when MONGODB_URI is set,
falling back to in-memory storage otherwise.
"""
import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

_employee_list: list = []

_mongo_client = None
_mongo_db = None
_db_connected = False
_db_status_message = 'Initializing secure connection client...'
_mongo_uri_host = ''
_has_attempted = False
_has_cleaned = False


def get_db_status() -> dict:
    return {
        'connected': _db_connected,
        'statusMessage': _db_status_message,
        'host': _mongo_uri_host or 'Local Secure Memory',
        'provider': 'Secure Cloud Datastore Engine' if _db_connected else 'Local Ledger Cache',
    }


def _get_mongo():
    global _mongo_client, _mongo_db, _db_connected, _db_status_message
    global _mongo_uri_host, _has_attempted, _has_cleaned

    if _db_connected and _mongo_db is not None:
        return _mongo_db

    uri = os.environ.get('MONGODB_URI')
    if not uri:
        _db_connected = False
        _db_status_message = 'Local Active Repository (Local Memory Active)'
        return None

    if _has_attempted and not _db_connected:
        return None

    try:
        _has_attempted = True
        import re
        match = re.search(r'@([^/]+)', uri)
        _mongo_uri_host = match.group(1) if match else 'Cloud Cluster'
        print(f"Connecting to datastore at: {_mongo_uri_host}...")

        _mongo_client = MongoClient(uri, connectTimeoutMS=4000, serverSelectionTimeoutMS=4000)
        # Force connection
        _mongo_client.admin.command('ping')
        _mongo_db = _mongo_client['retention_db']
        _db_connected = True
        _db_status_message = f'Connected to Secure Cloud Database ({_mongo_uri_host})'
        print(f'Datastore connected successfully! Status: {_db_status_message}')

        if not _has_cleaned:
            _has_cleaned = True
            count = _mongo_db['employees'].count_documents({})
            if count > 0:
                sample = _mongo_db['employees'].find_one({'id': 'EMP-1001'})
                if sample:
                    print('Detected prefilled seed employees. Clearing for clean slate...')
                    _mongo_db['employees'].delete_many({})

        return _mongo_db
    except Exception as e:
        print(f'MongoDB connection failed. Reverting to local memory: {e}')
        _db_connected = False
        _db_status_message = f'Fallback Active: Local storage fallback (Connection failed: {e})'
        return None


def ensure_db_attempt():
    if not _has_attempted:
        _get_mongo()


def fetch_employees() -> list:
    try:
        db = _get_mongo()
        if db is not None and _db_connected:
            docs = list(db['employees'].find({}))
            if docs:
                return [{k: v for k, v in doc.items() if k != '_id'} for doc in docs]
    except Exception as e:
        print(f'Failed to query MongoDB, using in-memory: {e}')
    return _employee_list


def fetch_employee_by_id(emp_id: str):
    try:
        db = _get_mongo()
        if db is not None and _db_connected:
            doc = db['employees'].find_one({'id': emp_id})
            if doc:
                return {k: v for k, v in doc.items() if k != '_id'}
    except Exception as e:
        print(f'Failed to find employee in MongoDB: {e}')
    return next((e for e in _employee_list if e.get('id') == emp_id), None)


def persist_employee(emp: dict):
    global _employee_list
    try:
        db = _get_mongo()
        if db is not None and _db_connected:
            db['employees'].update_one({'id': emp['id']}, {'$set': emp}, upsert=True)
            return
    except Exception as e:
        print(f'Failed to write to MongoDB, applying to memory: {e}')
    idx = next((i for i, e in enumerate(_employee_list) if e.get('id') == emp.get('id')), -1)
    if idx != -1:
        _employee_list[idx] = emp


def reset_all_data():
    global _employee_list
    try:
        db = _get_mongo()
        if db is not None and _db_connected:
            db['employees'].delete_many({})
            return
    except Exception as e:
        print(f'Failed to reset MongoDB: {e}')
    _employee_list = []


def import_employees(employees: list):
    global _employee_list
    try:
        db = _get_mongo()
        if db is not None and _db_connected:
            db['employees'].delete_many({})
            if employees:
                db['employees'].insert_many(employees)
    except Exception as e:
        print(f'Failed to import into MongoDB: {e}')
    _employee_list = employees
