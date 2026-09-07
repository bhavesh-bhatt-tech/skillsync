import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.question.createMany({
    data: [
      {
        topic: 'Java',
        subtopic: 'Concurrency',
        question: 'What are Virtual Threads in Java 21 and how do they improve throughput?',
        answer:
          '**Virtual Threads** (JEP 444) are lightweight threads managed by the JVM rather than the OS.\n\n' +
          '## Why they matter\n\n' +
          '| Platform Thread | Virtual Thread |\n|---|---|\n| ~1 MB stack | ~few KB stack |\n| OS-scheduled | JVM-scheduled |\n| ~thousands max | ~millions max |\n\n' +
          '```java\ntry (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n    IntStream.range(0, 10_000).forEach(i ->\n        executor.submit(() -> { Thread.sleep(Duration.ofSeconds(1)); return i; })\n    );\n}\n```',
        type: 'CONCEPTUAL',
        skills: ['Java 21', 'Concurrency', 'Virtual Threads'],
        roles: ['Backend Engineer', 'Tech Lead'],
        minExperience: 5,
      },
      {
        topic: 'Java',
        subtopic: 'Data Structures',
        question: 'Implement an LRU Cache in Java',
        answer:
          'Design a Least Recently Used (LRU) cache with **O(1)** get and put operations.\n\n' +
          '## Approach\n\nCombine a **doubly linked list** with a **hash map**.\n\n' +
          '| Operation | Time | Space |\n|---|---|---|\n| get | O(1) | O(capacity) |\n| put | O(1) | O(capacity) |',
        type: 'CODING',
        starterCode:
          'import java.util.*;\n\nclass LRUCache {\n    private final int capacity;\n    private final Map<Integer, Node> map = new HashMap<>();\n\n    static class Node { int key, val; Node prev, next; Node(int k, int v) { key = k; val = v; } }\n\n    public LRUCache(int capacity) { this.capacity = capacity; }\n\n    public int get(int key) { return -1; }\n\n    public void put(int key, int value) { }\n}',
        skills: ['Java', 'Data Structures', 'Design Patterns'],
        roles: ['Software Engineer', 'Senior Software Engineer'],
        minExperience: 3,
      },
      {
        topic: 'DevSecOps',
        subtopic: 'CI/CD',
        question: 'How do you integrate security into a DevSecOps pipeline?',
        answer:
          '**DevSecOps** shifts security *left* — baking automated security checks into every stage of the CI/CD pipeline.\n\n' +
          '## Pipeline stages and tooling\n\n' +
          '| Stage | Control | Example Tools |\n|---|---|---|\n| Source | Pre-commit hooks, secret scanning | gitleaks, trufflehog |\n| Build | SAST, dependency scanning | SonarQube, Snyk |\n| Package | Image scanning | Trivy, Grype |\n| Deploy | IaC scanning, policy gates | OPA, tfsec |\n| Runtime | Container & runtime monitoring | Falco, Aqua |',
        type: 'CONCEPTUAL',
        skills: ['DevSecOps', 'CI/CD', 'Security'],
        roles: ['DevOps Engineer', 'Platform Engineer', 'Tech Lead'],
        minExperience: 7,
      },
    ],
  });

  console.log('Seeded 3 questions.');
}

try {
  await main();
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
