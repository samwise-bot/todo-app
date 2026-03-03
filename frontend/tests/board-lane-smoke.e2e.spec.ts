import { expect, test } from '@playwright/test';

test('creates board lanes through UI actions with live backend state', async ({ page, request }) => {
  const projectName = 'Delivery';
  const boardName = 'Execution';
  const columnName = 'Doing';
  const taskTitle = 'Ship release';

  await page.goto('/');

  const createProjectForm = page.locator('form', { has: page.getByRole('heading', { name: 'Create project' }) });
  await createProjectForm.locator('input[name="name"]').fill(projectName);
  await createProjectForm.locator('input[name="description"]').fill('release train');
  await createProjectForm.getByRole('button', { name: 'Create project' }).click();

  const projectsSection = page.locator('section', { has: page.getByRole('heading', { name: 'Projects' }) });
  await expect(projectsSection.getByText(projectName, { exact: true })).toBeVisible();

  const boardManagementSection = page.locator('section', { has: page.getByRole('heading', { name: 'Board management' }) });
  const createBoardForm = boardManagementSection.locator('form', { has: page.getByRole('heading', { name: 'Create board' }) });
  await createBoardForm.locator('input[name="name"]').fill(boardName);
  await createBoardForm.locator('select[name="projectId"]').selectOption({ label: projectName });
  await createBoardForm.getByRole('button', { name: 'Create' }).click();

  const boardArticle = boardManagementSection.locator('article', { hasText: boardName });
  await expect(boardArticle).toBeVisible();

  await boardArticle.locator('input[name="name"]').last().fill(columnName);
  await boardArticle.locator('input[name="position"]').fill('1');
  await boardArticle.getByRole('button', { name: 'Add column' }).click();
  await expect(boardArticle.getByDisplayValue(columnName)).toBeVisible();

  const createTaskForm = page.locator('form', { has: page.getByRole('heading', { name: 'Create task' }) });
  await createTaskForm.locator('input[name="title"]').fill(taskTitle);
  await createTaskForm.locator('input[name="description"]').fill('v1.0.0');
  await createTaskForm.locator('select[name="projectId"]').selectOption({ label: projectName });
  await createTaskForm.locator('select[name="state"]').selectOption('next');
  await createTaskForm.getByRole('button', { name: 'Create task' }).click();

  const tasksSection = page.locator('section', { has: page.getByRole('heading', { name: 'Tasks' }) });
  const taskRow = tasksSection.locator('li', { has: page.getByText(taskTitle, { exact: true }) });
  await expect(taskRow).toBeVisible();
  await taskRow.locator('select[name="boardColumnId"]').selectOption({ label: `${boardName} / ${columnName}` });
  await taskRow.getByRole('button', { name: 'Set column' }).click();
  await expect(taskRow.getByText('Task moved to board column.')).toBeVisible();

  const laneSection = page.locator('section', { has: page.getByRole('heading', { name: 'Kanban lanes (by board columns)' }) });
  const laneBoard = laneSection.locator('article', { has: page.getByRole('heading', { name: boardName }) });
  await expect(laneBoard.getByRole('heading', { name: columnName })).toBeVisible();
  await expect(laneBoard.getByText(`${taskTitle} (next)`)).toBeVisible();
  await expect(laneSection.getByText('No tasks without a board column.')).toBeVisible();

  const tasksRes = await request.get('http://127.0.0.1:8080/api/tasks?page=1&pageSize=1000');
  await expect(tasksRes.ok()).toBeTruthy();
  const tasksPayload = await tasksRes.json();
  const createdTask = tasksPayload.items.find((task: { title: string }) => task.title === taskTitle);
  expect(createdTask).toBeTruthy();
  expect(createdTask.boardColumnId).toBeGreaterThan(0);
});
