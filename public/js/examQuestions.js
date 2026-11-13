// Exam Questions Bank
window.EXAM_DATA = {
  examId: 'CS-PROCTOR-2026',
  title: 'Full-Stack Software Architecture & Systems Integrity Assessment',
  description: 'Proctored technical evaluation testing core engineering concepts, security, and problem solving.',
  durationMinutes: 15,
  passingPercentage: 70,
  questions: [
    {
      id: 1,
      category: 'Software Architecture',
      question: 'Which architectural pattern is best suited for decoupling microservices through asynchronous event publication and consumption?',
      codeSnippet: `// Example flow:
Service A (Producer) ───[ Message ]───> Event Broker ───> Service B (Consumer)`,
      options: [
        'Monolithic Shared Database',
        'Event-Driven Architecture (EDA)',
        'Synchronous RPC with Strict Polling',
        'Client-Side Peer-to-Peer Mesh'
      ],
      correctAnswer: 1,
      explanation: 'Event-Driven Architecture decouples publishers and consumers by introducing an intermediary event broker (e.g. Kafka or RabbitMQ), allowing asynchronous and resilient communication.'
    },
    {
      id: 2,
      category: 'Web Security',
      question: 'What is the primary mitigation against Cross-Site Request Forgery (CSRF) in modern web applications using cookie-based authentication?',
      options: [
        'Encoding all output using base64',
        'Using anti-CSRF synchronizer tokens and SameSite cookie attributes',
        'Disabling HTTPS TLS certificates',
        'Storing passwords in plain-text browser cookies'
      ],
      correctAnswer: 1,
      explanation: 'Anti-CSRF synchronizer tokens paired with SameSite=Lax/Strict cookie flags prevent malicious third-party origins from triggering unauthorized state-changing actions.'
    },
    {
      id: 3,
      category: 'Algorithms & Data Structures',
      question: 'What is the worst-case time complexity of searching for an element in a balanced Binary Search Tree (AVL or Red-Black Tree)?',
      options: [
        'O(1)',
        'O(log n)',
        'O(n)',
        'O(n log n)'
      ],
      correctAnswer: 1,
      explanation: 'Because AVL and Red-Black trees maintain height balance within O(log n), search operations are guaranteed to complete in O(log n) worst-case time.'
    },
    {
      id: 4,
      category: 'Concurrency & OS',
      question: 'Consider the following JavaScript event loop snippet. What is the printed output sequence?',
      codeSnippet: `console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');`,
      options: [
        '1, 2, 3, 4',
        '1, 4, 3, 2',
        '1, 4, 2, 3',
        '4, 1, 3, 2'
      ],
      correctAnswer: 1,
      explanation: 'Synchronous statements run first ("1", "4"). Microtasks (Promise.then callbacks) drain before macrotasks (setTimeout), yielding "3" then "2". Final sequence: 1, 4, 3, 2.'
    },
    {
      id: 5,
      category: 'Database Systems',
      question: 'In relational databases (RDBMS), which ACID property guarantees that once a transaction has committed, its changes survive system crashes or power failures?',
      options: [
        'Atomicity',
        'Consistency',
        'Isolation',
        'Durability'
      ],
      correctAnswer: 3,
      explanation: 'Durability guarantees that committed transactions are permanently recorded in non-volatile storage (such as write-ahead logs) even across sudden power failures.'
    },
    {
      id: 6,
      category: 'Network & Protocols',
      question: 'Which HTTP status code should a server return when a client makes a valid request but lacks the necessary permissions to access the requested resource?',
      options: [
        '401 Unauthorized (Unauthenticated)',
        '403 Forbidden',
        '404 Not Found',
        '502 Bad Gateway'
      ],
      correctAnswer: 1,
      explanation: '403 Forbidden indicates the server understands the caller identity but refuses authorization, unlike 401 which indicates missing or invalid authentication credentials.'
    },
    {
      id: 7,
      category: 'Distributed Systems',
      question: 'According to the CAP theorem, in the presence of a network partition (P), what trade-off must a distributed system make?',
      options: [
        'It must sacrifice Persistence for Speed',
        'It must choose between Consistency (C) and Availability (A)',
        'It must eliminate all latency',
        'It must enforce single-leader replication exclusively'
      ],
      correctAnswer: 1,
      explanation: 'The CAP theorem proves that when network partitions occur, a distributed data store can guarantee either Consistency (all nodes see same data) or Availability (every request receives a response), but not both.'
    },
    {
      id: 8,
      category: 'Frontend & Browser Internals',
      question: 'Which browser lifecycle event fires immediately when a user switches away from the active tab or minimizes the browser window?',
      codeSnippet: `document.addEventListener('???', () => {
  if (document.hidden) {
    console.log('User switched away!');
  }
});`,
      options: [
        'pagehide',
        'visibilitychange',
        'beforeunload',
        'tabclose'
      ],
      correctAnswer: 1,
      explanation: 'The "visibilitychange" event on document fires whenever the document visibilityState transitions between visible and hidden (e.g. switching tabs or minimizing).'
    }
  ]
};
