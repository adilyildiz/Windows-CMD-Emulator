import React, { useState, useCallback } from 'react';
import { Terminal } from './components/Terminal';
import { useFileSystem } from './hooks/useFileSystem';
import { GoogleGenAI } from '@google/genai';
import { Editor } from './components/Editor';
import { FSType } from './types';

const fakeDns: { [key: string]: string } = {
  // --- Special Cases ---
  'localhost': '127.0.0.1',
  'unreachable.host': '10.255.255.1', // Special case for timeouts
  'WEB-EMULATOR': '192.168.1.100',

  // --- Tech Giants & Services ---
  'google.com': '142.250.184.174',
  'www.google.com': '142.250.191.36',
  'mail.google.com': '172.217.168.165',
  'drive.google.com': '172.217.12.78',
  'youtube.com': '172.217.16.142',
  'www.youtube.com': '142.250.191.142',
  'microsoft.com': '20.81.111.85',
  'www.microsoft.com': '20.42.73.119',
  'office.com': '52.178.228.18',
  'live.com': '40.97.166.194',
  'bing.com': '204.79.197.200',
  'apple.com': '17.253.144.10',
  'www.apple.com': '17.253.144.10',
  'icloud.com': '17.248.136.143',
  'amazon.com': '176.32.98.166',
  'www.amazon.com': '99.86.99.148',
  'aws.amazon.com': '52.94.24.162',
  'facebook.com': '157.240.22.35',
  'www.facebook.com': '157.240.22.35',
  'meta.com': '31.13.78.35',
  'instagram.com': '157.240.217.174',
  'www.instagram.com': '157.240.217.174',
  'whatsapp.com': '157.240.10.53',
  
  // --- Developer & Info ---
  'github.com': '140.82.121.4',
  'stackoverflow.com': '151.101.193.69',
  'wikipedia.org': '208.80.154.224',
  'en.wikipedia.org': '208.80.154.224',
  'developer.mozilla.org': '104.18.33.153',
  'npmjs.com': '104.16.24.35',
  'docker.com': '104.18.125.43',
  'git-scm.com': '185.199.108.153',
  'vercel.com': '76.76.21.21',
  'netlify.com': '68.66.195.101',

  // --- Social Media & Communication ---
  'twitter.com': '104.244.42.129',
  'x.com': '104.244.42.129',
  'linkedin.com': '108.174.10.10',
  'reddit.com': '151.101.129.140',
  'www.reddit.com': '151.101.1.140',
  'pinterest.com': '151.101.0.84',
  'tiktok.com': '162.159.135.83',
  'discord.com': '162.159.133.234',
  'slack.com': '52.6.255.158',
  'zoom.us': '34.205.111.121',
  'telegram.org': '149.154.167.99',
  'snapchat.com': '104.16.89.59',
  
  // --- Streaming & Entertainment ---
  'netflix.com': '52.22.184.227',
  'spotify.com': '35.186.224.25',
  'twitch.tv': '151.101.66.167',
  'disneyplus.com': '3.160.10.37',
  'hulu.com': '34.204.120.187',
  'soundcloud.com': '151.101.194.217',
  'imdb.com': '54.239.28.85',
  'vimeo.com': '151.101.64.217',

  // --- E-commerce & Shopping ---
  'ebay.com': '66.211.164.83',
  'etsy.com': '151.101.192.81',
  'walmart.com': '104.99.117.199',
  'target.com': '151.101.2.144',
  'bestbuy.com': '104.86.130.228',
  'alibaba.com': '47.252.2.66',
  'aliexpress.com': '205.204.96.1',
  'shopify.com': '23.227.38.65',
  'craigslist.org': '151.101.128.21',

  // --- News & Media ---
  'nytimes.com': '151.101.1.164',
  'cnn.com': '151.101.195.5',
  'bbc.com': '151.101.0.81',
  'bbc.co.uk': '151.101.128.81',
  'theguardian.com': '199.232.53.194',
  'reuters.com': '104.16.41.29',
  'forbes.com': '151.101.1.201',
  'wsj.com': '104.99.2.100',
  'weather.com': '151.101.194.225',
  'espn.com': '199.181.132.250',
  
  // --- Productivity & Business ---
  'salesforce.com': '96.43.148.82',
  'adobe.com': '152.195.39.37',
  'dropbox.com': '162.125.6.18',
  'oracle.com': '137.254.120.50',
  'ibm.com': '129.42.38.10',
  'cisco.com': '72.163.4.185',
  'intel.com': '13.35.34.137',
  'hp.com': '23.210.16.142',
  'dell.com': '143.166.147.6',
  'wordpress.org': '198.143.164.252',
  'wordpress.com': '192.0.73.2',
  'medium.com': '162.159.153.4',
  'quora.com': '3.211.127.202',
  
  // --- Search & Other ---
  'duckduckgo.com': '52.142.124.215',
  'yahoo.com': '74.6.143.25',
  'aol.com': '74.6.136.150',

  // --- TLD examples ---
  'google.co.uk': '172.217.168.227',
  'google.de': '172.217.168.163',
  'google.fr': '172.217.169.3',
  'google.jp': '172.217.167.78',
  'amazon.ca': '13.32.228.179',
  'amazon.co.uk': '52.94.23.11',
  'amazon.de': '52.94.224.210',

  // --- Finance ---
  'paypal.com': '64.4.250.33',
  'chase.com': '159.53.64.46',
  'bankofamerica.com': '171.161.29.170',
  'wellsfargo.com': '151.101.122.2',

  // --- Travel ---
  'booking.com': '104.18.29.131',
  'expedia.com': '4.244.204.60',
  'airbnb.com': '13.57.147.251',
  'tripadvisor.com': '104.16.113.197',
  'uber.com': '3.211.33.125',
  'lyft.com': '54.219.167.240',

  // --- Education ---
  'mit.edu': '18.9.22.69',
  'harvard.edu': '52.20.198.151',
  'stanford.edu': '171.67.215.200',
  'coursera.org': '13.226.238.109',
  'edx.org': '13.249.19.117',
  
  // --- Misc Popular ---
  'flickr.com': '68.142.220.73',
  'tumblr.com': '66.6.41.26',
  'godaddy.com': '208.109.4.225',
  // FIX: Removed duplicate 'stackoverflow.com' entry which was causing a syntax error.
  'stackexchange.com': '151.101.1.69',
};

const potentialConnections = [
      { proto: 'TCP', local: '127.0.0.1:5040', foreign: 'MACHINE:5041', state: 'ESTABLISHED' },
      { proto: 'TCP', local: '192.168.1.100:5357', foreign: 'MACHINE:49157', state: 'ESTABLISHED' },
      { proto: 'TCP', local: '192.168.1.100:49152', foreign: '157.55.39.109:https', state: 'TIME_WAIT' },
      { proto: 'TCP', local: '[::]:80', foreign: '[::]:0', state: 'LISTENING' },
      { proto: 'TCP', local: '[::]:443', foreign: '[::]:0', state: 'LISTENING' },
      { proto: 'TCP', local: '192.168.1.100:1337', foreign: 'gh-repo:https', state: 'ESTABLISHED' },
      { proto: 'TCP', local: '192.168.1.100:5050', foreign: 'some-service:https', state: 'CLOSE_WAIT' },
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const App: React.FC = () => {
  const { 
    cwd, dir, cd, type, del, ren, md, rd, attrib, fc, findCmd, xcopy, getCompletions,
    createVDisk, selectVDisk, attachVDisk, detachVDisk, detailVDisk, listVDisks, 
    formatDrive, mountedDrives, writeFile, getNode, resolvePath,
    listDisks, selectDisk, listVolumes, selectVolume, createPartitionPrimary, 
    formatSelectedVolume, deletePartition, cleanDisk
  } = useFileSystem();

  const [lines, setLines] = useState<React.ReactNode[]>([
    'Microsoft Windows [Version 10.0.22621.1]',
    '(c) Microsoft Corporation. All rights reserved.',
    '',
  ]);
  const [history, setHistory] = useState<string[]>([]);
  const [isDiskpart, setIsDiskpart] = useState(false);
  const [confirmation, setConfirmation] = useState<{ onConfirm: () => void, prompt: string } | null>(null);
  const [editingFile, setEditingFile] = useState<{ path: string; content: string } | null>(null);


  const print = useCallback((text: string | React.ReactNode) => {
    if (typeof text === 'string' && text.length > 0) {
        setLines(prev => [...prev, ...text.split('\n')]);
    } else if (React.isValidElement(text)) {
        setLines(prev => [...prev, text]);
    }
  }, []);

  const printCommand = useCallback((command: string) => {
    const prompt = confirmation ? '' : (isDiskpart ? 'DISKPART>' : `${cwd}>`);
    setLines(prev => [...prev, `${prompt}${command}`]);
  }, [cwd, isDiskpart, confirmation]);

  const handleSaveFile = (path: string, content: string) => {
      writeFile(path, content);
      setEditingFile(null);
  };

  const handleCancelEdit = () => {
      setEditingFile(null);
  };

  const runGemini = async (prompt: string) => {
    print('Asking Gemini...');
    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
      }
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      print(response.text);
    } catch (e) {
      const error = e as Error;
      print(`Error: ${error.message}`);
    }
  };

  const handleDiskpartCommand = useCallback((command: string) => {
    const commandLower = command.trim().toLowerCase();
    const parts = commandLower.split(/\s+/);
    const cmd = parts[0];
    const subCmd = parts[1];

    switch (cmd) {
        case 'list':
            if (subCmd === 'disk') return print(listDisks());
            if (subCmd === 'vdisk') return print(listVDisks());
            if (subCmd === 'volume' || subCmd === 'partition') return print(listVolumes());
            break;
        case 'select':
            if (subCmd === 'disk') {
                const diskNum = parseInt(parts[2], 10);
                if (!isNaN(diskNum)) return print(selectDisk(diskNum));
            }
            if (subCmd === 'vdisk') {
                const path = command.trim().match(/file=(.*)/i)?.[1].replace(/"/g, '');
                if (path) return print(selectVDisk(path));
            }
            if (subCmd === 'volume' || subCmd === 'partition') {
                if (parts[2]) return print(selectVolume(parts[2]));
            }
            break;
        case 'create':
            if (subCmd === 'partition' && parts[2] === 'primary') return print(createPartitionPrimary());
            if (subCmd === 'vdisk') {
                 const path = command.trim().match(/file=(.*)/i)?.[1].replace(/"/g, '');
                 if(path) return print(createVDisk(path));
            }
            break;
        case 'delete':
             if (subCmd === 'partition') return print(deletePartition());
             break;
        case 'clean':
             return print(cleanDisk());
        case 'format': {
            const fsMatch = commandLower.match(/fs=(\w+)/);
            const quickMatch = commandLower.includes('quick');
            if (quickMatch && fsMatch && (fsMatch[1] === 'ntfs')) {
                return print(formatSelectedVolume());
            }
            return print('The arguments specified for this command are not valid.\nUsage: FORMAT FS=NTFS QUICK');
        }
        case 'attach':
            if (subCmd === 'vdisk') return print(attachVDisk());
            break;
        case 'detach':
            if (subCmd === 'vdisk') return print(detachVDisk());
            break;
        case 'detail':
            if (subCmd === 'vdisk') return print(detailVDisk());
            break;
        case 'exit':
            setIsDiskpart(false);
            return;
        default:
             break;
    }
    print('The specified command is not valid.');
  }, [
      createVDisk, selectVDisk, attachVDisk, detachVDisk, listVDisks, detailVDisk, 
      listDisks, selectDisk, listVolumes, selectVolume, createPartitionPrimary, 
      formatSelectedVolume, deletePartition, cleanDisk, print
  ]);


  const onCommand = useCallback(async (command: string) => {
    printCommand(command);
    setHistory(prev => [...prev, command]);

    if (confirmation) {
        const answer = command.toLowerCase();
        if (answer === 'y' || answer === 'yes') {
            confirmation.onConfirm();
        } else {
            print('Operation aborted.');
        }
        setConfirmation(null);
        return;
    }

    if (isDiskpart) {
        handleDiskpartCommand(command);
        return;
    }

    const parts = command.trim().match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    if (parts.length === 0) return;
    
    const rawCmd = parts[0].toLowerCase();
    const args = parts.slice(1).map(arg => arg.replace(/"/g, ''));

    switch (rawCmd) {
      case 'help':
        print(
          <div className="text-sm">
            <p className="font-bold mb-1">Provides Help information for Windows commands.</p>
            <div className="grid grid-cols-2 gap-x-4">
              <div><p><span className="w-24 inline-block">ATTRIB</span>Displays or changes file attributes.</p></div>
              <div><p><span className="w-24 inline-block">CD</span>Displays or changes the current directory.</p></div>
              <div><p><span className="w-24 inline-block">CHKDSK</span>Checks a disk and displays a status report.</p></div>
              <div><p><span className="w-24 inline-block">CLS</span>Clears the screen.</p></div>
              <div><p><span className="w-24 inline-block">DEFRAG</span>Defragments a disk.</p></div>
              <div><p><span className="w-24 inline-block">DEL</span>Deletes one or more files.</p></div>
              <div><p><span className="w-24 inline-block">DIR</span>Displays a list of files and subdirectories.</p></div>
              <div><p><span className="w-24 inline-block">DISKPART</span>Manages disk partitions.</p></div>
              <div><p><span className="w-24 inline-block">EDIT</span>Edits a text file. Creates if not exists.</p></div>
              <div><p><span className="w-24 inline-block">FC</span>Compares two files and displays differences.</p></div>
              <div><p><span className="w-24 inline-block">FIND</span>Searches for a text string in a file.</p></div>
              <div><p><span className="w-24 inline-block">FORMAT</span>Formats a disk.</p></div>
              <div><p><span className="w-24 inline-block">FSUTIL</span>Displays file system utility information.</p></div>
              <div><p><span className="w-24 inline-block">HOSTNAME</span>Displays the host name.</p></div>
              <div><p><span className="w-24 inline-block">IPCONFIG</span>Displays IP configuration.</p></div>
              <div><p><span className="w-24 inline-block">MD</span>Creates a directory.</p></div>
              <div><p><span className="w-24 inline-block">NETSTAT</span>Displays active TCP connections.</p></div>
              <div><p><span className="w-24 inline-block">NSLOOKUP</span>Looks up IP addresses from a DNS server.</p></div>
              <div><p><span className="w-24 inline-block">PING</span>Pings a host.</p></div>
              <div><p><span className="w-24 inline-block">RD</span>Removes a directory.</p></div>
              <div><p><span className="w-24 inline-block">REN</span>Renames a file or files.</p></div>
              <div><p><span className="w-24 inline-block">SCANDISK</span>Runs a disk scan.</p></div>
              <div><p><span className="w-24 inline-block">TRACERT</span>Traces the route to a host.</p></div>
              <div><p><span className="w-24 inline-block">TYPE</span>Displays the contents of a text file.</p></div>
              <div><p><span className="w-24 inline-block">XCOPY</span>Copies files and directory trees.</p></div>
              <div><p><span className="w-24 inline-block">ASK</span>Ask Gemini AI a question.</p></div>
            </div>
          </div>
        );
        break;
      case 'dir':
        print(dir(args[0]));
        break;
      case 'cd':
        print(cd(args[0] || ''));
        break;
      case 'type':
        if (!args[0]) print('The syntax of the command is incorrect.');
        else print(type(args[0]));
        break;
      case 'cls':
        setLines([]);
        break;
      case 'ask':
        if (args.length === 0) print('ask: Please provide a question to ask Gemini.');
        else await runGemini(args.join(' '));
        break;
      case 'edit': {
        if (!args[0]) {
            print('The syntax of the command is incorrect. Usage: edit <filename>');
            break;
        }
        const filePath = resolvePath(args[0]);
        const node = getNode(filePath);

        if (node && node.type === FSType.DIRECTORY) {
            print(`Error: Cannot edit a directory.`);
            break;
        }

        if (!node) {
            const parentPath = filePath.substring(0, filePath.lastIndexOf('\\')) || filePath.substring(0, 2);
            const parentNode = getNode(parentPath);
            if (!parentNode || parentNode.type !== FSType.DIRECTORY) {
                print('The system cannot find the path specified.');
                break;
            }
        }
        
        const initialContent = node?.content || '';
        setEditingFile({ path: filePath, content: initialContent });
        break;
      }
      case 'del':
        if (!args[0]) print('The syntax of the command is incorrect.');
        else print(del(args[0]));
        break;
      case 'ren':
      case 'rename':
        if (args.length < 2) print('The syntax of the command is incorrect.');
        else print(ren(args[0], args[1]));
        break;
      case 'md':
      case 'mkdir':
        if (!args[0]) print('The syntax of the command is incorrect.');
        else print(md(args[0]));
        break;
      case 'rd':
      case 'rmdir':
        if (!args[0]) print('The syntax of the command is incorrect.');
        else print(rd(args[0]));
        break;
      case 'attrib':
        if (args.length < 2) print('The syntax of the command is incorrect. Missing flags or path.');
        else print(attrib(args[0], args[1]));
        break;
      case 'fc':
        if (args.length < 2) print('The syntax of the command is incorrect.');
        else print(fc(args[0], args[1]));
        break;
      case 'find':
        if (args.length < 2) print('The syntax of the command is incorrect.');
        else print(findCmd(args[0], args[1]));
        break;
      case 'xcopy':
        if (args.length < 2) print('The syntax of the command is incorrect.');
        else {
             const recursive = args.includes('/s');
             const paths = args.filter(a => a !== '/s');
             print(xcopy(paths[0], paths[1], recursive));
        }
        break;
      case 'diskpart':
        setIsDiskpart(true);
        print('Microsoft DiskPart version 10.0.22621.1\n\nCopyright (C) Microsoft Corporation.\nOn computer: WEB-EMULATOR');
        break;
      // Simulated commands
      case 'hostname':
        print('WEB-EMULATOR');
        break;
      case 'nslookup':
        const domain = args[0]?.toLowerCase();
        if (!domain) {
            print("Default Server:  UnKnown\nAddress:  192.168.1.1");
        } else {
            const ip = fakeDns[domain];
            if (ip) {
                print(`Server:  UnKnown\nAddress:  192.168.1.1\n\nNon-authoritative answer:\nName:    ${domain}\nAddress:  ${ip}`);
            } else {
                print(`Server:  UnKnown\nAddress:  192.168.1.1\n\n*** UnKnown can't find ${domain}: Non-existent domain`);
            }
        }
        break;
      case 'format':
          const drive = args[0]?.toUpperCase();
          if (!drive || !drive.match(/^[A-Z]:$/)) {
              print('Invalid drive specified for format.');
              break;
          }
          if (!mountedDrives.has(drive)) {
              print('The system cannot find the drive specified.');
              break;
          }
          if (cwd.toUpperCase().startsWith(drive)) {
              print('Cannot format the current working drive.');
              break;
          }
          setConfirmation({
              prompt: `WARNING, ALL DATA ON NON-REMOVABLE DISK\nDRIVE ${drive} WILL BE LOST!\nProceed with Format (Y/N)? `,
              onConfirm: () => {
                  print(formatDrive(drive));
              }
          });
          break;
      case 'defrag':
          const defragDrive = (args[0] || 'C:').toUpperCase();
          print(`Defragmenting drive ${defragDrive}...\nAnalysis... 100% complete.\nDefragmentation... 100% complete.\nDefragmentation complete.`);
          break;
      case 'scandisk':
          const scandiskDrive = (args[0] || 'C:').toUpperCase();
          print(`Scanning drive ${scandiskDrive}...\n\n Scandisk found no errors on drive ${scandiskDrive}.`);
          break;
      case 'ipconfig':
        print(`
Windows IP Configuration

Ethernet adapter Ethernet:
   Connection-specific DNS Suffix  . : hsd1.ca.comcast.net.
   IPv4 Address. . . . . . . . . . . : 192.168.1.100
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
        `);
        break;
      case 'ping':
        const hostToPing = (args[0] || 'localhost').toLowerCase();
        const ipToPing = fakeDns[hostToPing];
        
        if (!ipToPing) {
            print(`Ping request could not find host ${hostToPing}. Please check the name and try again.`);
            break;
        }

        if (hostToPing === 'unreachable.host') {
             print(`\nPinging ${hostToPing} [${ipToPing}] with 32 bytes of data:`);
             for (let i = 0; i < 4; i++) print('Request timed out.');
             break;
        }

        print(`\nPinging ${hostToPing} [${ipToPing}] with 32 bytes of data:`);
        for (let i = 0; i < 4; i++) {
            const time = hostToPing === 'localhost' ? '<1' : Math.floor(Math.random() * 50) + 10;
            print(`Reply from ${ipToPing}: bytes=32 time=${time}ms TTL=128`);
        }
        break;
      case 'tracert':
        const hostToTrace = (args[0] || '').toLowerCase();
        if (!hostToTrace) {
            print('Usage: tracert [-d] [-h maximum_hops] [-j host-list] [-w timeout] target_name');
            break;
        }
        const ipToTrace = fakeDns[hostToTrace];

        if (!ipToTrace) {
            print(`Unable to resolve target system name ${hostToTrace}.`);
            break;
        }
        
        print(`\nTracing route to ${hostToTrace} [${ipToTrace}] \nover a maximum of 30 hops:\n`);

        if (hostToTrace === 'localhost') {
            await sleep(100);
            print(`  1    <1 ms    <1 ms    <1 ms  ${ipToTrace}`);
            print('\nTrace complete.');
            break;
        }

        const hops = Math.floor(Math.random() * 8) + 8; // 8 to 15 hops
        let baseLatency = 5;

        for (let i = 1; i <= hops; i++) {
            await sleep(400); // Simulate network delay
            baseLatency += Math.floor(Math.random() * 10);
            const rtt1 = baseLatency + Math.floor(Math.random() * 5);
            const rtt2 = baseLatency + Math.floor(Math.random() * 5);
            const rtt3 = baseLatency + Math.floor(Math.random() * 5);

            if (hostToTrace === 'unreachable.host' && i > 3) {
                print(`  ${i.toString().padStart(2, ' ')}     *        *        *     Request timed out.`);
                continue;
            }

            let hopIp: string;
            if (i === hops) {
                hopIp = ipToTrace;
            } else {
                 // Generate a random intermediate IP
                 hopIp = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
            }

            print(`  ${i.toString().padStart(2, ' ')}   ${(rtt1+' ms').padStart(5)}  ${(rtt2+' ms').padStart(5)}  ${(rtt3+' ms').padStart(5)}  ${hopIp}`);
        }
        print('\nTrace complete.');
        break;
      case 'netstat':
        let output = `\nActive Connections\n  Proto  Local Address          Foreign Address        State\n`;
        const shuffled = [...potentialConnections].sort(() => 0.5 - Math.random());
        const selectedCount = Math.floor(Math.random() * 3) + 3;
        const selected = shuffled.slice(0, selectedCount);
        for(const conn of selected) {
            output += `  ${conn.proto.padEnd(5)} ${conn.local.padEnd(22)} ${conn.foreign.padEnd(22)} ${conn.state}\n`;
        }
        print(output);
        break;
      case 'chkdsk':
          const driveToCheck = (args[0] || cwd.substring(0, 2)).toUpperCase();
          print(`
The type of the file system is NTFS.
Checking drive ${driveToCheck}...

CHKDSK is verifying files (stage 1 of 3)...
  13824 file records processed.
File verification completed.
CHKDSK is verifying indexes (stage 2 of 3)...
  15640 index entries processed.
Index verification completed.
CHKDSK is verifying security descriptors (stage 3 of 3)...
  13824 security descriptors processed.
Security descriptor verification completed.
Windows has scanned the file system and found no problems.
        `);
        break;
      case 'fsutil':
        if (args[0]?.toLowerCase() === 'diskfree') {
          print(`
Total # of free bytes        : 18446744073709551615
Total # of bytes             : 268435456000
Total # of avail free bytes  : 18446744073709551615
          `);
        } else {
            print(`'fsutil ${args[0]}' is not a valid command.`);
        }
        break;
      default:
        print(`'${rawCmd}' is not recognized as an internal or external command,`);
        print('operable program or batch file.');
        break;
    }
  }, [print, printCommand, isDiskpart, handleDiskpartCommand, dir, cd, type, del, ren, md, rd, attrib, fc, findCmd, xcopy, formatDrive, getCompletions, cwd, confirmation, mountedDrives, resolvePath, getNode, writeFile]);

  return (
    <div className="bg-black text-gray-300 font-mono h-screen p-4 relative">
      {editingFile && (
        <Editor
          filePath={editingFile.path}
          initialContent={editingFile.content}
          onSave={handleSaveFile}
          onCancel={handleCancelEdit}
        />
      )}
      <Terminal
        lines={lines}
        history={history}
        onCommand={onCommand}
        prompt={confirmation ? confirmation.prompt : (isDiskpart ? 'DISKPART>' : `${cwd}>`)}
        getCompletions={getCompletions}
      />
    </div>
  );
};

export default App;