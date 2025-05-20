import type * as Lexc from '../app/types';

const API_URL = 'https://saturnine.xyz/api/lexicanter';
const requestOptions = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
}

export async function verify(userID: string, key: string): Promise<boolean> {
    try {
        const response = await fetch(API_URL, {
            ...requestOptions,
            body: JSON.stringify({
                userid: userID,
                key: key,
                action: {
                    type: 'verify'
                }
            })
        });
        const data = await response.json();
        // console.debug(data)
        return data.success;
    } catch (error) {
        console.error('Error verifying:', error);
        return false;
    }
}

export async function downloadFile(userID: string, key: string, fileName: string): Promise<Lexc.Language> {
    try {
        const response = await fetch(API_URL, {
            ...requestOptions,
            body: JSON.stringify({
                userid: userID,
                key: key,
                action: {
                    type: 'download',
                    file: fileName
                }
            })
        });
        const data = await response.json();
        if (data.success) {
            return data.file;
        }
        throw new Error(data.error || 'Failed to download file');
    } catch (error) {
        console.error('Error downloading file:', error);
        throw error;
    }
}

export async function uploadFile(userID: string, key: string, file: string) {
    try {
        const response = await fetch(API_URL, {
            ...requestOptions,
            body: JSON.stringify({
                userid: userID,
                key: key,
                action: {
                    type: 'upload',
                    file: file
                }
            })
        });
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to upload file');
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

export async function deleteFile(userID: string, key: string, fileName: string) {
    try {
        const response = await fetch(API_URL, {
            ...requestOptions,
            body: JSON.stringify({
                userid: userID,
                key: key,
                action: {
                    type: 'delete',
                    file: fileName
                }
            })
        });
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to delete file');
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

export async function updateAccount(userID: string, key: string, fields: {
    username?: string;
    displayName?: string;
    password?: string;
}) {
    try {
        const response = await fetch(API_URL, {
            ...requestOptions,
            body: JSON.stringify({
                userid: userID,
                key: key,
                action: {
                    type: 'edit account',
                    ...fields
                }
            })
        });
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to update account');
        }
    } catch (error) {
        console.error('Error updating account:', error);
        throw error;
    }
}