document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskButton = document.getElementById('addTaskButton');
    const taskList = document.getElementById('taskList');

    // タスク追加機能
    addTaskButton.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            addTask();
        }
    });

    function addTask() {
        const taskText = taskInput.value.trim();

        if (taskText === '') {
            // alert('タスクを入力してください。'); // ユーザーの指示にはないためコメントアウト
            return;
        }

        const listItem = document.createElement('li');
        listItem.textContent = taskText;

        // タスク完了切り替え機能
        listItem.addEventListener('click', () => {
            listItem.classList.toggle('completed');
        });

        taskList.appendChild(listItem);
        taskInput.value = ''; // 入力フィールドを空にする
    }
});
