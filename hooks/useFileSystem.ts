import { useState, useCallback, useEffect } from 'react';
import { FSNode, FSType } from '../types';

const initialFileSystem: FSNode = {
  name: 'C:',
  type: FSType.DIRECTORY,
  creationTime: new Date(),
  children: [
    {
      name: 'Users',
      type: FSType.DIRECTORY,
      creationTime: new Date(),
      children: [
        {
          name: 'User',
          type: FSType.DIRECTORY,
          creationTime: new Date(),
          children: [
            { name: 'Documents', type: FSType.DIRECTORY, creationTime: new Date(), children: [] },
            { name: 'Desktop', type: FSType.DIRECTORY, creationTime: new Date(), children: [] },
            { 
              name: 'README.txt', 
              type: FSType.FILE, 
              content: 'Welcome to this Windows CMD emulator!',
              creationTime: new Date(),
              size: 41,
              attributes: { readOnly: false }
            },
             { 
              name: 'config.sys', 
              type: FSType.FILE, 
              content: 'DEVICE=C:\\WINDOWS\\HIMEM.SYS',
              creationTime: new Date(),
              size: 29,
              attributes: { readOnly: true }
            },
          ],
        },
      ],
    },
     {
      name: 'Windows',
      type: FSType.DIRECTORY,
      creationTime: new Date(),
      children: [
         { name: 'System32', type: FSType.DIRECTORY, creationTime: new Date(), children: [] },
      ]
    },
  ],
};


const formatDate = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}  ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const deepCopyNode = (node: FSNode): FSNode => {
    const newNode: any = { ...node };
    if (node.children) {
        newNode.children = node.children.map(deepCopyNode);
    }
    return newNode;
};

const getDriveLetterFromPath = (path: string): string => {
    if (path.includes(':')) {
        return path.split(':')[0].toUpperCase() + ':';
    }
    return '';
}

// Pure helper function to find a node within a given file system state (Map of drives)
const findNodeAndParentOnDrives = (
    path: string, 
    drives: Map<string, FSNode>, 
    currentWorkingDir: string
): { node: FSNode | null, parent: FSNode | null, nodeName: string, fsRoot: FSNode | null } => {
    
    // Pure version of resolvePath, operating on the provided drives map and cwd
    const resolvePathPure = (pathToResolve: string): string => {
        const getDrive = (p: string): string => {
            if (p.includes(':')) { return p.split(':')[0].toUpperCase() + ':'; }
            return '';
        }
        const currentDrive = getDrive(currentWorkingDir);
        let targetDrive = (getDrive(pathToResolve) || currentDrive).toUpperCase();
        if (!drives.has(targetDrive)) {
             return pathToResolve;
        }
        
        if (pathToResolve.match(/^[a-zA-Z]:\\?$/)) {
            return targetDrive + '\\';
        }

        const isAbsolutePath = pathToResolve.toUpperCase().startsWith(targetDrive);
        const basePath = isAbsolutePath ? targetDrive + '\\' : currentWorkingDir;
        
        let pathParts = (isAbsolutePath ? pathToResolve.substring(targetDrive.length + 1) : pathToResolve).split('\\').filter(p => p);
        let newPathParts = basePath.split('\\').filter(p => p && p.toUpperCase() !== targetDrive.toUpperCase());

        for (const part of pathParts) {
            if (part === '..') {
                newPathParts.pop();
            } else if (part !== '.' && part !== '') {
                newPathParts.push(part);
            }
        }
        return targetDrive + (newPathParts.length > 0 ? '\\' + newPathParts.join('\\') : '');
    };

    const resolvedPath = resolvePathPure(path);
    const driveLetter = getDriveLetterFromPath(resolvedPath);
    const fsRoot = drives.get(driveLetter);

    if (!fsRoot) return { node: null, parent: null, nodeName: '', fsRoot: null };

    const parts = resolvedPath.split('\\').filter(p => p && p.toUpperCase() !== driveLetter.toUpperCase());
    
    if (parts.length === 0) {
        return { node: fsRoot, parent: null, nodeName: driveLetter, fsRoot };
    }
    
    let currentNode: FSNode = fsRoot;
    let parentNode: FSNode | null = null;
    
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const foundChild = currentNode.children?.find(child => child.name.toLowerCase() === part.toLowerCase());
        if (foundChild) {
            parentNode = currentNode;
            currentNode = foundChild;
        } else {
             if (i === parts.length - 1) {
                return { node: null, parent: currentNode, nodeName: part, fsRoot };
            }
            return { node: null, parent: null, nodeName: part, fsRoot: null };
        }
    }

    return { node: currentNode, parent: parentNode, nodeName: parts[parts.length - 1], fsRoot };
};


export const useFileSystem = () => {
    const [mountedDrives, setMountedDrives] = useState<Map<string, FSNode>>(() => {
        const savedFS = localStorage.getItem('cmd_emulator_fs');
        if (savedFS) {
            try {
                const parsedArray = JSON.parse(savedFS, (key, value) => {
                    if (key === 'creationTime' && typeof value === 'string') {
                        return new Date(value);
                    }
                    return value;
                });
                return new Map(parsedArray);
            } catch (e) {
                console.error("Failed to parse file system from localStorage", e);
                return new Map([['C:', initialFileSystem]]);
            }
        }
        return new Map([['C:', initialFileSystem]]);
    });

    const [cwd, setCwd] = useState('C:\\Users\\User');
    const [selectedVDiskPath, setSelectedVDiskPath] = useState<string | null>(null);

    useEffect(() => {
        try {
            const arrayToSave = Array.from(mountedDrives.entries());
            localStorage.setItem('cmd_emulator_fs', JSON.stringify(arrayToSave));
        } catch (e) {
            console.error("Failed to save file system to localStorage", e);
        }
    }, [mountedDrives]);

    const resolvePath = useCallback((path: string): string => {
        const currentDrive = getDriveLetterFromPath(cwd);
        let targetDrive = (getDriveLetterFromPath(path) || currentDrive).toUpperCase();
        if (!mountedDrives.has(targetDrive)) {
             return path; // Invalid drive
        }
        
        if (path.match(/^[a-zA-Z]:\\?$/)) { // e.g. C: or C:\
            return targetDrive + '\\';
        }

        const isAbsolutePath = path.toUpperCase().startsWith(targetDrive);
        const basePath = isAbsolutePath ? targetDrive + '\\' : cwd;
        
        let pathParts = (isAbsolutePath ? path.substring(targetDrive.length + 1) : path).split('\\').filter(p => p);
        let newPathParts = basePath.split('\\').filter(p => p && p.toUpperCase() !== targetDrive.toUpperCase());

        for (const part of pathParts) {
            if (part === '..') {
                newPathParts.pop();
            } else if (part !== '.' && part !== '') {
                newPathParts.push(part);
            }
        }
        return targetDrive + (newPathParts.length > 0 ? '\\' + newPathParts.join('\\') : '');
    }, [cwd, mountedDrives]);


    const findNodeAndParent = useCallback((path: string): { node: FSNode | null, parent: FSNode | null, nodeName: string, fsRoot: FSNode | null } => {
        const resolvedPath = resolvePath(path);
        const driveLetter = getDriveLetterFromPath(resolvedPath);
        const fsRoot = mountedDrives.get(driveLetter);

        if (!fsRoot) return { node: null, parent: null, nodeName: '', fsRoot: null };

        const parts = resolvedPath.split('\\').filter(p => p && p.toUpperCase() !== driveLetter.toUpperCase());
        
        if (parts.length === 0) { // Root of the drive
            return { node: fsRoot, parent: null, nodeName: driveLetter, fsRoot };
        }
        
        let currentNode: FSNode = fsRoot;
        let parentNode: FSNode | null = null;
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const foundChild = currentNode.children?.find(child => child.name.toLowerCase() === part.toLowerCase());
            if (foundChild) {
                parentNode = currentNode;
                currentNode = foundChild;
            } else {
                 if (i === parts.length - 1) { // Last part of the path, node not found
                    return { node: null, parent: currentNode, nodeName: part, fsRoot };
                }
                return { node: null, parent: null, nodeName: part, fsRoot: null };
            }
        }

        return { node: currentNode, parent: parentNode, nodeName: parts[parts.length - 1], fsRoot };
    }, [resolvePath, mountedDrives]);

    const findNode = useCallback((path: string) => findNodeAndParent(path).node, [findNodeAndParent]);
    const getNode = useCallback((path: string) => findNode(path), [findNode]);

    const mutateFileSystem = (mutator: (drives: Map<string, FSNode>) => void) => {
        setMountedDrives(prevDrives => {
            const newDrives = new Map<string, FSNode>();
            for (const [letter, fs] of prevDrives.entries()) {
                newDrives.set(letter, deepCopyNode(fs));
            }
            mutator(newDrives);
            return newDrives;
        });
    };
    
    // Read-only commands
    const cd = useCallback((path: string) => {
        if (!path) {
            return cwd;
        }

        if (path.match(/^[a-zA-Z]:$/i)) {
            const drive = path.toUpperCase();
            if (mountedDrives.has(drive)) {
                setCwd(drive + '\\');
                return '';
            }
            return 'The system cannot find the drive specified.';
        }

        const resolved = resolvePath(path || 'C:\\');
        const targetNode = findNode(resolved);
        if (targetNode && targetNode.type === FSType.DIRECTORY) {
            setCwd(resolved.endsWith('\\') && resolved.length > 3 ? resolved.slice(0, -1) : resolved);
            return '';
        }
        return 'The system cannot find the path specified.';
    }, [findNode, resolvePath, mountedDrives, cwd]);

    const dir = useCallback((path?: string) => {
        const targetPath = path || cwd;
        const resolvedTargetPath = resolvePath(targetPath);
        const targetNode = findNode(resolvedTargetPath);

        if (!targetNode || targetNode.type !== FSType.DIRECTORY) {
            return ` Directory of ${resolvedTargetPath}\nFile Not Found`;
        }
        const content = targetNode.children?.map(child => {
            const time = formatDate(child.creationTime || new Date());
            const type = child.type === FSType.DIRECTORY ? '<DIR>' : (child.size || 0).toString().padStart(12, ' ');
            return `${time}    ${type}    ${child.name}`;
        }).join('\n') || '';

        return `
 Directory of ${resolvedTargetPath}

${content}
               ${targetNode.children?.filter(c => c.type === FSType.FILE).length || 0} File(s)
               ${targetNode.children?.filter(c => c.type === FSType.DIRECTORY).length || 0} Dir(s)
`;
    }, [findNode, cwd, resolvePath]);

    const type = useCallback((path: string) => {
        const targetNode = findNode(path);
        if (!targetNode) return 'The system cannot find the file specified.';
        if (targetNode.type === FSType.DIRECTORY) return 'Access is denied.';
        return targetNode.content || '';
    }, [findNode]);

    // Mutating commands
    const writeFile = useCallback((path: string, content: string) => {
        mutateFileSystem((drives) => {
            const { node, parent, nodeName } = findNodeAndParentOnDrives(path, drives, cwd);

            if (node && node.type === FSType.FILE) {
                node.content = content;
                node.size = content.length;
            } else if (!node && parent && parent.type === FSType.DIRECTORY) {
                if (!parent.children) parent.children = [];
                parent.children.push({
                    name: nodeName,
                    type: FSType.FILE,
                    content: content,
                    size: content.length,
                    creationTime: new Date(),
                    attributes: { readOnly: false },
                });
            }
        });
        return '';
    }, [cwd]);

    const del = useCallback((path: string) => {
        const { node } = findNodeAndParent(path);
        if (!node) return 'The system cannot find the file specified.';
        if (node.type === FSType.DIRECTORY) return 'Access is denied.';
        if (node.attributes?.readOnly) return 'Access is denied.';

        mutateFileSystem((drives) => {
            const { node: nodeToDelete, parent } = findNodeAndParentOnDrives(path, drives, cwd);
            if (parent?.children && nodeToDelete) {
                parent.children = parent.children.filter(child => child.name.toLowerCase() !== nodeToDelete.name.toLowerCase());
            }
        });
        return '';
    }, [findNodeAndParent, cwd]);

    const ren = useCallback((oldPath: string, newName: string) => {
         const { node } = findNodeAndParent(oldPath);
         if (!node) return 'The system cannot find the file specified.';
         
         mutateFileSystem((drives) => {
            const { node: nodeToRename } = findNodeAndParentOnDrives(oldPath, drives, cwd);
            if (nodeToRename) {
                nodeToRename.name = newName;
            }
        });
        return '';
    }, [findNodeAndParent, cwd]);

    const md = useCallback((path: string) => {
        const { node, parent } = findNodeAndParent(path);
        if (node) return 'A subdirectory or file with that name already exists.';
        if (!parent) return 'The system cannot find the path specified.';
        
        mutateFileSystem((drives) => {
            const { parent: newParent, nodeName } = findNodeAndParentOnDrives(path, drives, cwd);
            if (newParent && newParent.type === FSType.DIRECTORY) {
                 if(!newParent.children) newParent.children = [];
                 newParent.children.push({
                    name: nodeName,
                    type: FSType.DIRECTORY,
                    creationTime: new Date(),
                    children: []
                 });
            }
        });
        return '';
    }, [findNodeAndParent, cwd]);

    const rd = useCallback((path: string) => {
        const { node } = findNodeAndParent(path);
        if (!node) return 'The system cannot find the path specified.';
        if (node.type !== FSType.DIRECTORY) return 'The filename, directory name, or volume label syntax is incorrect.';
        if (node.children && node.children.length > 0) return 'The directory is not empty.';

        mutateFileSystem((drives) => {
            const { node: nodeToDelete, parent } = findNodeAndParentOnDrives(path, drives, cwd);
            if (parent?.children && nodeToDelete) {
                 parent.children = parent.children.filter(child => child.name.toLowerCase() !== nodeToDelete.name.toLowerCase());
            }
        });
        return '';
    }, [findNodeAndParent, cwd]);

    const attrib = useCallback((flags: string, path: string) => {
        const { node } = findNodeAndParent(path);
        if (!node || node.type !== FSType.FILE) return `File not found - ${path}`;

        const setReadOnly = flags.includes('+r');
        const removeReadOnly = flags.includes('-r');

        mutateFileSystem((drives) => {
            const { node: nodeToChange } = findNodeAndParentOnDrives(path, drives, cwd);
            if(nodeToChange && nodeToChange.type === FSType.FILE) {
                if (!nodeToChange.attributes) nodeToChange.attributes = { readOnly: false };
                if(setReadOnly) nodeToChange.attributes.readOnly = true;
                if(removeReadOnly) nodeToChange.attributes.readOnly = false;
            }
        });
        return '';
    }, [findNodeAndParent, cwd]);
    
    const fc = useCallback((path1: string, path2: string) => {
        const node1 = findNode(path1);
        const node2 = findNode(path2);
        if (!node1 || !node2) return 'The system cannot find the file specified.';
        if (node1.type !== FSType.FILE || node2.type !== FSType.FILE) return 'Comparing directories is not supported.';
        const content1 = node1.content || '';
        const content2 = node2.content || '';
        if (content1 === content2) return `Comparing files ${path1} and ${path2}\nFC: no differences encountered`;
        return `Comparing files ${path1} and ${path2}\n***** ${path1}\n${content1}\n***** ${path2}\n${content2}\n*****`;
    }, [findNode]);

    const findCmd = useCallback((searchTerm: string, path: string) => {
        const node = findNode(path);
        if (!node || node.type !== FSType.FILE) return `File not found - ${path}`;
        const lines = (node.content || '').split('\n');
        const matchingLines = lines.filter(line => line.toLowerCase().includes(searchTerm.toLowerCase()));
        if (matchingLines.length === 0) return '';
        return `---------- ${path.toUpperCase()}\n${matchingLines.join('\n')}`;
    }, [findNode]);

    const xcopy = useCallback((sourcePath: string, destPath: string, recursive: boolean) => {
        const { node: sourceNode } = findNodeAndParent(sourcePath);
        if (!sourceNode) return `File not found - ${sourcePath}`;
        
        const copiedSource = deepCopyNode(sourceNode);
         if (!recursive && copiedSource.type === FSType.DIRECTORY) {
             copiedSource.children = copiedSource.children?.filter(c => c.type === FSType.FILE);
         }

        mutateFileSystem((drives) => {
            const { node: newDestNode, parent: newDestParent, nodeName: newDestName } = findNodeAndParentOnDrives(destPath, drives, cwd);
            if (!newDestParent) return;

            if (newDestNode && newDestNode.type === FSType.DIRECTORY) {
                if (!newDestNode.children) newDestNode.children = [];
                newDestNode.children.push(copiedSource);
            } else {
                 copiedSource.name = newDestName;
                 if (!newDestParent.children) newDestParent.children = [];
                 newDestParent.children.push(copiedSource);
            }
        });
        return `Copied 1 file(s).`;
    }, [findNodeAndParent, cwd]);

    // Diskpart commands
    const createVDisk = useCallback((path: string) => {
        if (!path.toLowerCase().endsWith('.vhd')) {
            return 'The filename, directory name, or volume label syntax is incorrect. (Must be .vhd)';
        }
        const { node, parent } = findNodeAndParent(path);
        if (node) return 'A file with that name already exists.';
        if (!parent) return 'The system cannot find the path specified.';

        const vdiskRoot: FSNode = { name: 'VDiskRoot', type: FSType.DIRECTORY, children: [], creationTime: new Date() };
        
        mutateFileSystem((drives) => {
            const { parent: newParent, nodeName } = findNodeAndParentOnDrives(path, drives, cwd);
            if (newParent?.children) {
                 newParent.children.push({
                    name: nodeName,
                    type: FSType.FILE,
                    creationTime: new Date(),
                    content: JSON.stringify(vdiskRoot),
                    size: 1024,
                    attributes: { readOnly: false },
                    vDiskInfo: { isAttached: false, driveLetter: null }
                 });
            }
        });
        return '  100 percent completed\n\nDiskPart successfully created the virtual disk file.';
    }, [findNodeAndParent, cwd]);

    const selectVDisk = useCallback((path: string) => {
        const { node } = findNodeAndParent(path);
        if (!node || node.type !== FSType.FILE || !path.toLowerCase().endsWith('.vhd')) {
            return 'The specified file is not a virtual disk.';
        }
        setSelectedVDiskPath(resolvePath(path));
        return 'DiskPart successfully selected the virtual disk file.';
    }, [findNodeAndParent, resolvePath]);

    const attachVDisk = useCallback(() => {
        if (!selectedVDiskPath) return 'There is no virtual disk selected.';
        const { node } = findNodeAndParent(selectedVDiskPath);
        if (!node?.vDiskInfo || node.vDiskInfo.isAttached) return 'The virtual disk is already attached.';

        const nextLetter = 'DEFGH'.split('').find(l => !mountedDrives.has(l + ':'));
        if (!nextLetter) return 'No available drive letters.';
        const drive = nextLetter + ':';

        try {
            const vdiskRoot = JSON.parse(node.content || '{}');
            vdiskRoot.name = drive;

            mutateFileSystem(drives => {
                drives.set(drive, vdiskRoot);
                const { node: vdiskNode } = findNodeAndParentOnDrives(selectedVDiskPath, drives, cwd);
                if (vdiskNode?.vDiskInfo) {
                    vdiskNode.vDiskInfo.isAttached = true;
                    vdiskNode.vDiskInfo.driveLetter = drive;
                }
            });
            return '  100 percent completed\n\nDiskPart successfully attached the virtual disk file.';
        } catch (e) {
            return 'The virtual disk file is corrupted.';
        }
    }, [selectedVDiskPath, mountedDrives, findNodeAndParent, cwd]);
    
    const detachVDisk = useCallback(() => {
        if (!selectedVDiskPath) return 'There is no virtual disk selected.';
        const { node } = findNodeAndParent(selectedVDiskPath);
        if (!node?.vDiskInfo || !node.vDiskInfo.isAttached) return 'The virtual disk is not attached.';

        const driveLetter = node.vDiskInfo.driveLetter;
        if (driveLetter) {
            mutateFileSystem(drives => {
                const vdiskFS = drives.get(driveLetter);
                drives.delete(driveLetter);
                const { node: vdiskNode } = findNodeAndParentOnDrives(selectedVDiskPath, drives, cwd);
                if(vdiskFS && vdiskNode) {
                    vdiskNode.content = JSON.stringify(vdiskFS);
                    if (vdiskNode.vDiskInfo) {
                        vdiskNode.vDiskInfo.isAttached = false;
                        vdiskNode.vDiskInfo.driveLetter = null;
                    }
                }
            });
        }
        return 'DiskPart successfully detached the virtual disk file.';
    }, [selectedVDiskPath, findNodeAndParent, cwd]);

    const detailVDisk = useCallback(() => {
        if (!selectedVDiskPath) return 'There is no virtual disk selected.';
        const { node } = findNodeAndParent(selectedVDiskPath);
        if (!node) return 'The selected virtual disk file does not exist.';

        return `
  Filename: ${node.name}
  Path: ${selectedVDiskPath}
  Type: ${node.vDiskInfo?.isAttached ? 'Attached' : 'Detached'}
  Mounted as: ${node.vDiskInfo?.driveLetter || 'N/A'}
`;
    }, [selectedVDiskPath, findNodeAndParent]);

    const listVDisks = useCallback(() => {
        const vdisks: string[] = [];
        const search = (node: FSNode, currentPath: string) => {
            if (node.name.toLowerCase().endsWith('.vhd')) {
                vdisks.push(`${currentPath}\\${node.name}`);
            }
            if (node.type === FSType.DIRECTORY && node.children) {
                node.children.forEach(child => search(child, `${currentPath}\\${node.name}`));
            }
        };
        const cDrive = mountedDrives.get('C:');
        cDrive?.children?.forEach(child => search(child, 'C:'));

        if (vdisks.length === 0) return 'There are no virtual disks.';

        return `  VDisk ###  Status     Path\n  ---------  ---------  --------------------------\n` + vdisks.map((path, i) => `  Disk ${i}      Online     ${path}`).join('\n');
    }, [mountedDrives]);
    
    const formatDrive = useCallback((drive: string) => {
        const driveLetter = drive.toUpperCase();
        if (!mountedDrives.has(driveLetter)) {
            return 'Invalid drive letter.';
        }
        mutateFileSystem(drives => {
            const driveRoot = drives.get(driveLetter);
            if (driveRoot) {
                driveRoot.children = [];
            }
        });
        return `Formatting drive ${driveLetter}...\nFormat complete.`;
    }, [mountedDrives]);


    const getCompletions = useCallback((text: string): FSNode[] => {
         const parts = text.split('\\');
         const partialName = parts.pop() || '';
         const path = parts.join('\\');

         const node = findNode(path || cwd);
         if (node && node.type === FSType.DIRECTORY && node.children) {
             return node.children.filter(child => child.name.toLowerCase().startsWith(partialName.toLowerCase()));
         }
         return [];
    }, [findNode, cwd]);


    return { cwd, dir, cd, type, del, ren, md, rd, attrib, fc, findCmd, xcopy, getCompletions, createVDisk, selectVDisk, attachVDisk, detachVDisk, detailVDisk, listVDisks, formatDrive, mountedDrives, writeFile, getNode, resolvePath };
};