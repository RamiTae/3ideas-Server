const { questions, users, answers } = require('../../models');

module.exports = {
  //? 질문글 등록 요청 ( /ask )
  post: (req, res) => {
    const { username, title, contents } = req.body;
    if (!username || !title || !contents) {
      //! username, title, contents 중 하나라도 null이면 안 됨
      return res.status(400).json('Please send valid syntax');
    }

    users
      .findOne({ where: { userName: username } })
      .then(result => {
        //? username 존재여부 확인
        if (!result) {
          //! username이 존재하지 않음
          return res.status(404).json('invalid username!');
        }

        const user_id = result.id;
        questions
          .create({ title, contents, user_id })
          .then(result => {
            //* 입력에 성공하면 새로 생성된 question의 id를 response로 보내줌
            const { id } = result;
            res.status(201).json({ id });
          })
          .catch(err => res.status(400).send(err));
      })
      .catch(err => res.status(400).send(err));
  },

  //? 질문글 보기 요청 ( /ask/질문글id )
  get: (req, res) => {
    const { askId } = req.params;
    if (!parseInt(askId)) {
      //! askId가 숫자가 아님
      return res.status(400).json('invalid API parameter');
    }

    questions
      .findOne({
        where: { id: askId },
        include: [
          {
            model: users,
            attributes: ['userName'],
          },
          {
            model: answers,
            attributes: ['id'],
          },
        ],
      })
      .then(result => {
        if (!result) {
          //! 해당 id의 질문글이 없음
          return res.status(404).json('invalid ask id');
        }

        const { id, title, contents, questionFlag, createdAt, updatedAt } = result;
        const username = result.user.userName;
        const commentsCount = result.answers.length;
        res.status(200).json({ id, title, contents, username, questionFlag, createdAt, updatedAt, commentsCount });
      })
      .catch(err => res.status(400).send(err));
  },

  //? 질문글 수정 요청 ( /ask/질문글id )
  patch: (req, res) => {
    const { askId } = req.params;
    if (!parseInt(askId)) {
      //! askId가 숫자가 아님
      return res.status(400).json('invalid API parameter');
    }

    const { title, contents, questionFlag } = req.body;
    if (!title && !contents && !questionFlag) {
      //! title, contents, questionFlag 셋 다 없으면 안됨.
      return res.status(400).json('Please send patch data');
    }

    const patchValues = {};
    if (title) {
      patchValues.title = title;
    }
    if (contents) {
      patchValues.contents = contents;
    }
    if (questionFlag) {
      patchValues.questionFlag = questionFlag;
    }

    questions
      .update(patchValues, { where: { id: askId } })
      .then(([affectedRows]) => {
        // console.log(affectedRows);
        if (!affectedRows) {
          return res.status(400).json('fail to patch');
        }
        res.status(200).json({ id: askId });
      })
      .catch(err => res.status(400).send(err));
  },

  //? 질문글 삭제 요청 ( /ask/질문글id )
  delete: (req, res) => {
    const askId = req.params.askId;
    if (!parseInt(askId)) {
      //! askId가 숫자가 아님
      return res.status(400).json('invalid API parameter');
    }

    questions
      .destroy({ where: { id: askId } })
      .then(destroyedRows => {
        if (!destroyedRows) {
          return res.status(422).json('invalid ask id');
        }

        res.status(200).json(`id: ${askId} delete complete`);
      })
      .catch(err => res.status(400).send(err));
  },
};
